'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggle sync on/off for a screen set.
 * When enabling, sets the sync epoch to now() so all screens start in unison.
 * Bumps refresh_version on all screens so they re-fetch the manifest.
 */
export async function toggleSync(screenSetId: string, enabled: boolean) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership via profile → client → store → screen set
    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const { data: screenSet } = await supabase
        .from('display_screen_sets')
        .select('id, store:display_stores(client_id)')
        .eq('id', screenSetId)
        .single()

    if (!screenSet) return { error: 'Screen set not found' }

    const storeClientId = (screenSet.store as any)?.client_id
    const isSuperAdmin = profile.role === 'super_admin'
    const isOwner = profile.role === 'client_admin' && profile.client_id === storeClientId

    if (!isSuperAdmin && !isOwner) {
        return { error: 'Forbidden: Insufficient permissions' }
    }

    // Update sync state
    const updateData: { sync_enabled: boolean; sync_epoch?: string } = {
        sync_enabled: enabled,
    }

    // When enabling, set epoch to now
    if (enabled) {
        updateData.sync_epoch = new Date().toISOString()
    }

    const { error: updateError } = await supabase
        .from('display_screen_sets')
        .update(updateData)
        .eq('id', screenSetId)

    if (updateError) return { error: 'Failed to update sync settings' }

    // Bump refresh_version on all screens in the set so they re-fetch
    const { data: screens } = await supabase
        .from('display_screens')
        .select('id, refresh_version')
        .eq('screen_set_id', screenSetId)

    if (screens?.length) {
        const updates = screens.map(s => ({
            id: s.id,
            refresh_version: (s.refresh_version || 0) + 1,
        }))
        await supabase.from('display_screens').upsert(updates)
    }

    // Audit log
    await supabase.from('display_audit_log').insert({
        actor_id: user.id,
        entity: 'screen_sets',
        entity_id: screenSetId,
        action: enabled ? 'sync_enabled' : 'sync_disabled',
        details: { screen_count: screens?.length || 0 },
    })

    revalidatePath(`/app/screen-sets/${screenSetId}`)
    return { success: true }
}

/**
 * Reset the sync epoch for a screen set.
 * All screens will restart their playlist cycle in unison.
 */
export async function resetSyncEpoch(screenSetId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const { data: screenSet } = await supabase
        .from('display_screen_sets')
        .select('id, sync_enabled, store:display_stores(client_id)')
        .eq('id', screenSetId)
        .single()

    if (!screenSet) return { error: 'Screen set not found' }
    if (!screenSet.sync_enabled) return { error: 'Sync is not enabled on this set' }

    const storeClientId = (screenSet.store as any)?.client_id
    const isSuperAdmin = profile.role === 'super_admin'
    const isOwner = profile.role === 'client_admin' && profile.client_id === storeClientId

    if (!isSuperAdmin && !isOwner) {
        return { error: 'Forbidden: Insufficient permissions' }
    }

    // Use the RPC function to atomically reset epoch + bump versions
    const { error } = await supabase.rpc('display_reset_sync_epoch', {
        p_screen_set_id: screenSetId,
    })

    if (error) return { error: 'Failed to reset sync epoch' }

    revalidatePath(`/app/screen-sets/${screenSetId}`)
    return { success: true }
}
