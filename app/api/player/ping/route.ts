import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const OFFLINE_GAP_MS = 3 * 60 * 1000

export async function POST(request: NextRequest) {
    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const { token, display_type, viewport } = body ?? {}

    if (!token || typeof token !== 'string' || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

    const limited = rateLimit('player-ping', token, { maxRequests: 3, windowMs: 60000 })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createAdminClient()
    const now = new Date()

    const { data: screen, error: fetchError } = await supabase
        .from('display_screens')
        .select('id, last_seen_at, current_status')
        .eq('player_token', token)
        .maybeSingle()

    if (fetchError || !screen) {
        return NextResponse.json({ error: 'Screen not found' }, { status: 404 })
    }

    const priorStatus: string = screen.current_status ?? 'never_connected'
    const priorSeen = screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : null
    const gapMs = priorSeen ? now.getTime() - priorSeen : null
    const isTransition = priorStatus !== 'online' || (gapMs !== null && gapMs > OFFLINE_GAP_MS)

    const { error: updateError } = await supabase
        .from('display_screens')
        .update({
            last_seen_at: now.toISOString(),
            current_status: 'online',
            ...(isTransition ? { status_changed_at: now.toISOString() } : {}),
        })
        .eq('id', screen.id)

    if (updateError) {
        return NextResponse.json({ error: 'Failed to record ping' }, { status: 500 })
    }

    if (isTransition) {
        await supabase.from('display_screen_events').insert({
            screen_id: screen.id,
            event_type: 'online',
            severity: 'info',
            details: {
                prior_status: priorStatus,
                gap_ms: gapMs,
                viewport: viewport ?? null,
                display_type: display_type ?? null,
            },
        })
    }

    return NextResponse.json({ success: true })
}
