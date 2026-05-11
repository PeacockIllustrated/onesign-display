import { createClient } from '@/lib/supabase/server'
import { ActivityFeedLive, type ActivityFeedItem } from './activity-feed-live'
import type { EventSeverity } from '@/lib/event-formatting'

type Raw = {
    id: string
    screen_id: string
    created_at: string
    event_type: string
    severity: string
    details: Record<string, unknown> | null
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

    const initial: ActivityFeedItem[] = ((data ?? []) as unknown as Raw[]).map(e => {
        const storeRel = e.screen?.store
        const storeName = Array.isArray(storeRel) ? storeRel[0]?.name : storeRel?.name
        return {
            id: e.id,
            screen_id: e.screen_id,
            created_at: e.created_at,
            event_type: e.event_type,
            severity: e.severity as EventSeverity,
            details: e.details,
            screen_name: e.screen?.name ?? 'Unknown screen',
            store_name: storeName ?? null,
        }
    })

    return <ActivityFeedLive initial={initial} limit={limit} title={title} />
}
