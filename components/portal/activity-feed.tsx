import { createClient } from '@/lib/supabase/server'
import { EventRow } from './event-row'
import type { EventSeverity, ScreenEvent } from '@/lib/event-formatting'

type ActivityRow = ScreenEvent & {
    screen_id: string
    screen?: {
        id: string
        name: string
        store?: { name: string } | { name: string }[] | null
    } | null
}

export async function ActivityFeed({
    limit = 50,
    title = 'Recent Activity',
}: {
    limit?: number
    title?: string
}) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('display_screen_events')
        .select('id, screen_id, created_at, event_type, severity, details, screen:display_screens(id, name, store:display_stores(name))')
        .order('created_at', { ascending: false })
        .limit(limit)

    const events = (data ?? []) as unknown as ActivityRow[]

    return (
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                {events.length > 0 && (
                    <span className="text-[11px] text-zinc-400">Last {events.length}</span>
                )}
            </div>

            {events.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-400">
                    No activity yet
                </div>
            ) : (
                <div className="divide-y divide-zinc-50 max-h-[480px] overflow-y-auto">
                    {events.map(e => {
                        const screenName = e.screen?.name ?? 'Unknown screen'
                        const storeRel = e.screen?.store
                        const storeName = Array.isArray(storeRel) ? storeRel[0]?.name : storeRel?.name
                        return (
                            <EventRow
                                key={e.id}
                                event={{
                                    id: e.id,
                                    created_at: e.created_at,
                                    event_type: e.event_type,
                                    severity: e.severity as EventSeverity,
                                    details: e.details,
                                }}
                                screen={{
                                    id: e.screen_id,
                                    name: screenName,
                                    storeName: storeName ?? null,
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}
