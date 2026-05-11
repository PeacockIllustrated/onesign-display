'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EventRow } from './event-row'
import type { EventSeverity, ScreenEvent } from '@/lib/event-formatting'

export type ActivityFeedItem = ScreenEvent & {
    screen_id: string
    screen_name: string
    store_name: string | null
}

type RawEvent = {
    id: string
    screen_id: string
    created_at: string
    event_type: string
    severity: string
    details: Record<string, unknown> | null
}

export function ActivityFeedLive({
    initial,
    limit = 50,
    title,
}: {
    initial: ActivityFeedItem[]
    limit?: number
    title: string
}) {
    const [events, setEvents] = useState<ActivityFeedItem[]>(initial)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel('screen-events-feed')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'display_screen_events' },
                async (payload) => {
                    const row = payload.new as RawEvent
                    // Look up the screen name for this row. RLS filters this for
                    // us — if the user can't see the screen they can't see the
                    // event either, even though postgres_changes already filtered
                    // events server-side.
                    const { data: screen } = await supabase
                        .from('display_screens')
                        .select('id, name, store:display_stores(name)')
                        .eq('id', row.screen_id)
                        .maybeSingle()
                    if (!screen) return

                    const storeRel = (screen as any).store
                    const storeName = Array.isArray(storeRel) ? storeRel[0]?.name : storeRel?.name

                    const item: ActivityFeedItem = {
                        id: row.id,
                        screen_id: row.screen_id,
                        created_at: row.created_at,
                        event_type: row.event_type,
                        severity: row.severity as EventSeverity,
                        details: row.details,
                        screen_name: (screen as any).name ?? 'Unknown screen',
                        store_name: storeName ?? null,
                    }

                    setEvents(prev => {
                        if (prev.some(e => e.id === item.id)) return prev
                        return [item, ...prev].slice(0, limit)
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [limit])

    return (
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live" />
                </div>
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
                    {events.map(e => (
                        <EventRow
                            key={e.id}
                            event={{
                                id: e.id,
                                created_at: e.created_at,
                                event_type: e.event_type,
                                severity: e.severity,
                                details: e.details,
                            }}
                            screen={{
                                id: e.screen_id,
                                name: e.screen_name,
                                storeName: e.store_name,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
