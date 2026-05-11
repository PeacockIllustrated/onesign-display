'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScreenStatusPanel } from './screen-status-panel'

type ScreenInfo = {
    id: string
    name: string
    last_seen_at: string | null
    current_status: string
    status_changed_at: string | null
    content_name?: string | null
    store_name: string
    screen_set_name: string
}

export function ScreenStatusPanelLive({
    initial,
    title,
    showAllLink,
}: {
    initial: ScreenInfo[]
    title?: string
    showAllLink?: string
}) {
    const [screens, setScreens] = useState<ScreenInfo[]>(initial)

    // If the initial prop changes (server re-renders for any reason), reset.
    useEffect(() => {
        setScreens(initial)
    }, [initial])

    useEffect(() => {
        if (initial.length === 0) return
        const supabase = createClient()
        const screenIds = new Set(initial.map(s => s.id))

        const channel = supabase
            .channel('screen-status-live')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'display_screens' },
                (payload) => {
                    const row = payload.new as {
                        id: string
                        last_seen_at: string | null
                        current_status: string
                        status_changed_at: string | null
                    }
                    if (!screenIds.has(row.id)) return
                    setScreens(prev => prev.map(s => s.id === row.id
                        ? {
                            ...s,
                            last_seen_at: row.last_seen_at,
                            current_status: row.current_status,
                            status_changed_at: row.status_changed_at,
                        }
                        : s
                    ))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [initial])

    return <ScreenStatusPanel screens={screens} title={title} showAllLink={showAllLink} />
}
