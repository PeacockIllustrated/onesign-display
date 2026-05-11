export type EventSeverity = 'info' | 'warning' | 'error'

export type ScreenEvent = {
    id: string
    created_at: string
    event_type: string
    severity: EventSeverity
    details: Record<string, unknown> | null
}

const TYPE_LABELS: Record<string, string> = {
    online: 'Came online',
    offline: 'Went offline',
    media_load_failed: 'Media failed to load',
    manifest_fetch_failed: 'Manifest fetch failed',
    playback_started: 'Started playback',
    content_assigned: 'Content reassigned',
}

export function eventLabel(eventType: string): string {
    return TYPE_LABELS[eventType] ?? eventType
}

export function severityDotClass(severity: EventSeverity): string {
    switch (severity) {
        case 'error': return 'bg-red-500'
        case 'warning': return 'bg-amber-500'
        case 'info':
        default: return 'bg-emerald-500'
    }
}

export function severityTextClass(severity: EventSeverity): string {
    switch (severity) {
        case 'error': return 'text-red-600'
        case 'warning': return 'text-amber-600'
        case 'info':
        default: return 'text-emerald-600'
    }
}

export function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}

export function summariseDetails(eventType: string, details: Record<string, unknown> | null): string | null {
    if (!details) return null
    const d = details as Record<string, any>

    switch (eventType) {
        case 'online':
            if (typeof d.gap_ms === 'number') {
                const mins = Math.floor(d.gap_ms / 60000)
                return mins > 0 ? `after ${mins}m offline` : null
            }
            return null
        case 'offline':
            if (typeof d.duration_online_ms === 'number') {
                const mins = Math.floor(d.duration_online_ms / 60000)
                return mins > 0 ? `was online for ${mins}m` : null
            }
            return null
        case 'content_assigned':
            return d.kind ? `${d.kind}` : null
        case 'media_load_failed':
        case 'manifest_fetch_failed':
            return typeof d.status === 'number' ? `HTTP ${d.status}` : null
        default:
            return null
    }
}
