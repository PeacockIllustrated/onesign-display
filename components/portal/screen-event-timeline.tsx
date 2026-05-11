import { createClient } from '@/lib/supabase/server'
import { EventRow } from './event-row'
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

    const events = ((data ?? []) as Array<{
        id: string
        created_at: string
        event_type: string
        severity: string
        details: Record<string, unknown> | null
    }>).map<ScreenEvent>(e => ({
        id: e.id,
        created_at: e.created_at,
        event_type: e.event_type,
        severity: e.severity as EventSeverity,
        details: e.details,
    }))

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h3 className="text-sm font-medium text-zinc-900">Activity</h3>
                {events.length > 0 && (
                    <span className="text-[11px] text-zinc-400">Last {events.length}</span>
                )}
            </div>

            {events.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-400">
                    No activity recorded yet
                </div>
            ) : (
                <div className="divide-y divide-zinc-50 max-h-[480px] overflow-y-auto">
                    {events.map(e => (
                        <EventRow key={e.id} event={e} />
                    ))}
                </div>
            )}
        </div>
    )
}
