import type { SupabaseClient } from '@supabase/supabase-js'

type ContentKind = 'media' | 'playlist' | 'stream' | 'html_menu'

/**
 * Log a content_assigned event when an admin reassigns content on a screen.
 *
 * Best-effort: failures are swallowed so the calling action's primary write
 * (the actual content assignment) is never blocked by audit-log issues.
 */
export async function logContentAssigned(
    supabase: SupabaseClient,
    screenId: string,
    kind: ContentKind,
    contentId: string,
    actorId: string | null,
): Promise<void> {
    try {
        await supabase.from('display_screen_events').insert({
            screen_id: screenId,
            event_type: 'content_assigned',
            severity: 'info',
            details: {
                kind,
                content_id: contentId,
                actor_id: actorId,
            },
        })
    } catch {
        // Swallow — never let telemetry break a content assignment.
    }
}
