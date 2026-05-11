import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_EVENTS = new Set([
    'media_load_failed',
    'manifest_fetch_failed',
    'playback_started',
])

const ALLOWED_SEVERITIES = new Set(['info', 'warning', 'error'])
const DEDUP_WINDOW_MS = 5 * 60 * 1000

export async function POST(request: NextRequest) {
    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { token, event_type, severity, details } = body ?? {}

    if (!token || typeof token !== 'string' || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }
    if (!event_type || !ALLOWED_EVENTS.has(event_type)) {
        return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }
    const sev = severity && ALLOWED_SEVERITIES.has(severity)
        ? severity
        : (event_type === 'playback_started' ? 'info' : 'warning')

    const limited = rateLimit('player-event', token, { maxRequests: 10, windowMs: 60_000 })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createAdminClient()

    const { data: screen } = await supabase
        .from('display_screens')
        .select('id')
        .eq('player_token', token)
        .maybeSingle()

    if (!screen) {
        return NextResponse.json({ error: 'Screen not found' }, { status: 404 })
    }

    const dedupKey = details && typeof details === 'object'
        ? (details.media_id ?? details.url ?? null)
        : null

    if (dedupKey) {
        const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
        const { data: recent } = await supabase
            .from('display_screen_events')
            .select('details')
            .eq('screen_id', screen.id)
            .eq('event_type', event_type)
            .gte('created_at', cutoff)
            .limit(20)

        const isDup = recent?.some(r => {
            const d = (r.details ?? {}) as Record<string, unknown>
            return d.media_id === dedupKey || d.url === dedupKey
        })
        if (isDup) {
            return NextResponse.json({ success: true, dedup: true })
        }
    }

    const safeDetails = details && typeof details === 'object' && !Array.isArray(details)
        ? details
        : null

    await supabase.from('display_screen_events').insert({
        screen_id: screen.id,
        event_type,
        severity: sev,
        details: safeDetails,
    })

    return NextResponse.json({ success: true })
}
