import { createClient } from '@/lib/supabase/server'
import { ScreenEventTimelineLive } from './screen-event-timeline-live'
import type { EventSeverity, ScreenEvent } from '@/lib/event-formatting'

export async function ScreenEventTimeline({
    screenId,
    limit = 50,
}: {
    screenId: string
    limit?: number
}) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('display_screen_events')
        .select('id, created_at, event_type, severity, details')
        .eq('screen_id', screenId)
        .order('created_at', { ascending: false })
        .limit(limit)

    const initial: ScreenEvent[] = ((data ?? []) as Array<{
        id: string
        created_at: string
        event_type: string
        severity: string
        details: Record<string, unknown> | null
    }>).map(e => ({
        id: e.id,
        created_at: e.created_at,
        event_type: e.event_type,
        severity: e.severity as EventSeverity,
        details: e.details,
    }))

    return <ScreenEventTimelineLive screenId={screenId} initial={initial} limit={limit} />
}
