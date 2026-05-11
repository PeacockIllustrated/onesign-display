import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000

export async function GET(request: NextRequest) {
    const auth = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET
    if (!expected || auth !== `Bearer ${expected}`) {
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

    const ids = stale.map(s => s.id)

    const { error: updateError } = await supabase
        .from('display_screens')
        .update({ current_status: 'offline', status_changed_at: now.toISOString() })
        .in('id', ids)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const events = stale.map(s => ({
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

    await supabase.from('display_screen_events').insert(events)

    return NextResponse.json({ flipped: stale.length })
}
