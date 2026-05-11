import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000

function authorised(request: NextRequest): boolean {
    const expected = process.env.CRON_SECRET
    if (!expected) return false
    const auth = request.headers.get('authorization') ?? ''
    const expectedHeader = `Bearer ${expected}`
    const a = Buffer.from(auth)
    const b = Buffer.from(expectedHeader)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
    if (!authorised(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    const now = new Date()
    const cutoff = new Date(now.getTime() - OFFLINE_THRESHOLD_MS).toISOString()

    const { data: stale, error: fetchError } = await supabase
        .from('display_screens')
        .select('id, last_seen_at, status_changed_at')
        .eq('current_status', 'online')
        .lt('last_seen_at', cutoff)

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!stale || stale.length === 0) {
        return NextResponse.json({ flipped: 0 })
    }

    // Re-apply the staleness predicates on UPDATE so a ping that lands between
    // the SELECT and the UPDATE doesn't get its status overwritten. Use
    // .select('id') so we know exactly which rows actually flipped.
    const ids = stale.map(s => s.id)
    const { data: flipped, error: updateError } = await supabase
        .from('display_screens')
        .update({ current_status: 'offline', status_changed_at: now.toISOString() })
        .in('id', ids)
        .eq('current_status', 'online')
        .lt('last_seen_at', cutoff)
        .select('id')

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const flippedIds = new Set((flipped ?? []).map(r => r.id))
    const events = stale.filter(s => flippedIds.has(s.id)).map(s => ({
        screen_id: s.id,
        event_type: 'offline',
        severity: 'warning',
        details: {
            last_seen_at: s.last_seen_at,
            duration_online_ms: s.status_changed_at
                ? now.getTime() - new Date(s.status_changed_at).getTime()
                : null,
        },
    }))

    if (events.length > 0) {
        const { error: insertError } = await supabase
            .from('display_screen_events')
            .insert(events)
        if (insertError) {
            console.error('[cron/screen-status] event insert failed', insertError.message)
        }
    }

    return NextResponse.json({ flipped: events.length })
}
