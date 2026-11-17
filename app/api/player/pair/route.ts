import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { generatePairingCode, normalisePairingCode, PAIRING_TTL_MS } from '@/lib/player/pairing'

/**
 * Short-code pairing for TVs.
 *
 * POST { device_secret }          → { code, expires_at }   (TV asks for a code)
 * GET  ?code=…&device_secret=…    → { status, token? }     (TV polls until paired)
 *
 * The device secret is a random string the TV keeps in localStorage. Only the
 * device that asked for a code can collect the token, so reading a code off
 * someone else's screen doesn't leak anything.
 */

function validSecret(s: unknown): s is string {
    return typeof s === 'string' && s.length >= 16 && s.length <= 128
}

export async function POST(request: NextRequest) {
    const limited = rateLimit('player-pair-create', getClientIp(request), { maxRequests: 10, windowMs: 60000 })
    if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    let body: any
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
    const secret = body?.device_secret
    if (!validSecret(secret)) return NextResponse.json({ error: 'Invalid device' }, { status: 400 })

    const supabase = await createAdminClient()
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString()

    // Collisions are vanishingly rare; retry a couple of times anyway.
    for (let attempt = 0; attempt < 3; attempt++) {
        const code = generatePairingCode()
        const { error } = await supabase
            .from('display_pairing_codes')
            .insert({ code, device_secret: secret, expires_at: expiresAt })
        if (!error) return NextResponse.json({ code, expires_at: expiresAt })
        if (error.code !== '23505') {
            console.error('[pair] insert failed', error.message)
            return NextResponse.json({ error: 'Pairing unavailable' }, { status: 500 })
        }
    }
    return NextResponse.json({ error: 'Pairing unavailable' }, { status: 500 })
}

export async function GET(request: NextRequest) {
    const code = normalisePairingCode(request.nextUrl.searchParams.get('code'))
    const secret = request.nextUrl.searchParams.get('device_secret')
    if (!code || !validSecret(secret)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const limited = rateLimit('player-pair-poll', code, { maxRequests: 30, windowMs: 60000 })
    if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const supabase = await createAdminClient()
    const { data: row } = await supabase
        .from('display_pairing_codes')
        .select('code, device_secret, screen_id, expires_at, claimed_at, screen:display_screens(player_token)')
        .eq('code', code)
        .maybeSingle()

    if (!row || row.device_secret !== secret) {
        return NextResponse.json({ status: 'unknown' }, { status: 404 })
    }

    const screen = row.screen as unknown as { player_token: string } | null
    if (row.claimed_at && screen?.player_token) {
        await supabase.from('display_pairing_codes')
            .update({ collected_at: new Date().toISOString() })
            .eq('code', code)
        return NextResponse.json({ status: 'paired', token: screen.player_token }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ status: 'expired' })
    }

    return NextResponse.json({ status: 'waiting' }, { headers: { 'Cache-Control': 'no-store' } })
}
