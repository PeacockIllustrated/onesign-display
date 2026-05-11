import { createAdminClient } from '@/lib/supabase/server'

type ContentKind = 'media' | 'playlist' | 'stream' | 'html_menu'

/**
 * Log a content_assigned event when an admin reassigns content on a screen.
 *
 * Uses the admin (service-role) client because display_screen_events only has
 * a SELECT RLS policy — there are no INSERT policies for user-scoped clients,
 * so request-scoped clients would have their writes silently denied.
 *
 * Surfaces errors via console.error so a broken audit pipeline shows up in
 * logs rather than disappearing into a swallowed catch.
 */
export async function logContentAssigned(
    screenId: string,
    kind: ContentKind,
    contentId: string,
    actorId: string | null,
): Promise<void> {
    try {
        const admin = await createAdminClient()
        const { error } = await admin.from('display_screen_events').insert({
            screen_id: screenId,
            event_type: 'content_assigned',
            severity: 'info',
            details: {
                kind,
                content_id: contentId,
                actor_id: actorId,
            },
        })
        if (error) {
            console.error('[screen-events] content_assigned insert failed', {
                screen_id: screenId,
                kind,
                error: error.message,
            })
        }
    } catch (err) {
        console.error('[screen-events] content_assigned unexpected error', err)
    }
}
