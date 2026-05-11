'use client'

import { useEffect, useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EventRow } from './event-row'
import type { EventSeverity, ScreenEvent } from '@/lib/event-formatting'

type RawEvent = {
    id: string
    screen_id: string
    created_at: string
    event_type: string
    severity: string
    details: Record<string, unknown> | null
}

export function ScreenEventTimelineLive({
    screenId,
    initial,
    limit = 50,
}: {
    screenId: string
    initial: ScreenEvent[]
    limit?: number
}) {
    const [events, setEvents] = useState<ScreenEvent[]>(initial)
    const instanceId = useId()

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`screen-events-${screenId}:${instanceId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'display_screen_events',
                    filter: `screen_id=eq.${screenId}`,
                },
                (payload) => {
                    const row = payload.new as RawEvent
                    const item: ScreenEvent = {
                        id: row.id,
                        created_at: row.created_at,
                        event_type: row.event_type,
                        severity: row.severity as EventSeverity,
                        details: row.details,
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
    }, [screenId, limit, instanceId])

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-900">Activity</h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live" />
                </div>
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
