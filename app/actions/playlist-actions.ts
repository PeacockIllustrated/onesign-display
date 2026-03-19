'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Helpers ──────────────────────────────────────────────────

async function verifyPlaylistOwnership(supabase: any, userId: string, playlistId: string) {
    const { data: playlist } = await supabase
        .from('display_playlists')
        .select('id, client_id')
        .eq('id', playlistId)
        .single()

    if (!playlist) throw new Error('Playlist not found')

    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id')
        .eq('id', userId)
        .single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isOwner = profile?.role === 'client_admin' && profile.client_id === playlist.client_id

    if (!isSuperAdmin && !isOwner) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    return { playlist, profile }
}

async function cascadeRefreshForPlaylist(supabase: any, playlistId: string) {
    // Find all screens actively using this playlist and bump their refresh_version
    const { data: screens } = await supabase
        .from('display_screen_content')
        .select('screen_id')
        .eq('playlist_id', playlistId)
        .eq('active', true)

    if (screens && screens.length > 0) {
        // Track synced screen sets that need epoch reset
        const syncedSetIds = new Set<string>()

        for (const sc of screens) {
            const { data: screen } = await supabase
                .from('display_screens')
                .select('refresh_version, screen_set_id')
                .eq('id', sc.screen_id)
                .single()

            if (screen) {
                await supabase
                    .from('display_screens')
                    .update({ refresh_version: (screen.refresh_version || 0) + 1 })
                    .eq('id', sc.screen_id)

                // Collect synced screen set IDs for epoch reset
                if (screen.screen_set_id) {
                    syncedSetIds.add(screen.screen_set_id)
                }
            }
        }

        // Reset sync epoch on any affected synced screen sets
        // This ensures all screens restart their cycle in unison after playlist edits
        for (const setId of syncedSetIds) {
            await supabase.rpc('display_reset_sync_epoch', {
                p_screen_set_id: setId,
            })
        }
    }
}

// ── CRUD ─────────────────────────────────────────────────────

export async function createPlaylist(clientId: string, name: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify client ownership
    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isOwner = profile?.role === 'client_admin' && profile.client_id === clientId

    if (!isSuperAdmin && !isOwner) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    if (!name || name.length > 255) {
        throw new Error('Invalid playlist name')
    }

    const { data, error } = await supabase
        .from('display_playlists')
        .insert({ client_id: clientId, name })
        .select()
        .single()

    if (error) throw new Error('Failed to create playlist')

    revalidatePath('/app/playlists')
    redirect(`/app/playlists/${data.id}`)
}

export async function updatePlaylist(playlistId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await verifyPlaylistOwnership(supabase, user.id, playlistId)

    const name = formData.get('name') as string
    const transition = formData.get('transition') as string
    const transitionDuration = parseInt(formData.get('transitionDuration') as string) || 500
    const loop = formData.get('loop') === 'on'

    const validTransitions = ['fade', 'cut', 'slide_left', 'slide_right']
    if (!validTransitions.includes(transition)) {
        throw new Error('Invalid transition type')
    }

    if (transitionDuration < 0 || transitionDuration > 5000) {
        throw new Error('Transition duration must be between 0 and 5000ms')
    }

    const { error } = await supabase
        .from('display_playlists')
        .update({
            name,
            transition,
            transition_duration_ms: transitionDuration,
            loop,
            updated_at: new Date().toISOString(),
        })
        .eq('id', playlistId)

    if (error) throw new Error('Failed to update playlist')

    await cascadeRefreshForPlaylist(supabase, playlistId)

    revalidatePath(`/app/playlists/${playlistId}`)
}

export async function deletePlaylist(playlistId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await verifyPlaylistOwnership(supabase, user.id, playlistId)

    // Cascade refresh BEFORE deleting (so screens know to reload)
    await cascadeRefreshForPlaylist(supabase, playlistId)

    const { error } = await supabase
        .from('display_playlists')
        .delete()
        .eq('id', playlistId)

    if (error) throw new Error('Failed to delete playlist')

    revalidatePath('/app/playlists')
    redirect('/app/playlists')
}

// ── Item Management ──────────────────────────────────────────

export async function addPlaylistItem(playlistId: string, mediaAssetId: string, durationSeconds: number = 10) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await verifyPlaylistOwnership(supabase, user.id, playlistId)

    // Get next position
    const { data: items } = await supabase
        .from('display_playlist_items')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1)

    const nextPosition = items && items.length > 0 ? items[0].position + 1 : 1

    const { error } = await supabase
        .from('display_playlist_items')
        .insert({
            playlist_id: playlistId,
            media_asset_id: mediaAssetId,
            position: nextPosition,
            duration_seconds: durationSeconds,
        })

    if (error) {
        console.error('[Playlist] Failed to add item:', error)
        throw new Error('Failed to add item to playlist')
    }

    await cascadeRefreshForPlaylist(supabase, playlistId)

    revalidatePath(`/app/playlists/${playlistId}`)
}

export async function removePlaylistItem(playlistId: string, itemId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await verifyPlaylistOwnership(supabase, user.id, playlistId)

    const { error } = await supabase
        .from('display_playlist_items')
        .delete()
        .eq('id', itemId)

    if (error) throw new Error('Failed to remove item')

    // Re-index positions
    const { data: remaining } = await supabase
        .from('display_playlist_items')
        .select('id')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true })

    if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
            await supabase
                .from('display_playlist_items')
                .update({ position: i + 1 })
                .eq('id', remaining[i].id)
        }
    }

    await cascadeRefreshForPlaylist(supabase, playlistId)

    revalidatePath(`/app/playlists/${playlistId}`)
}

export async function reorderPlaylistItems(playlistId: string, itemIds: string[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await verifyPlaylistOwnership(supabase, user.id, playlistId)

    if (!itemIds || itemIds.length === 0) {
        throw new Error('No items to reorder')
    }

    // Update positions based on array order — check each result
    const errors: string[] = []
    for (let i = 0; i < itemIds.length; i++) {
        const { error } = await supabase
            .from('display_playlist_items')
            .update({ position: i + 1 })
            .eq('id', itemIds[i])
            .eq('playlist_id', playlistId) // Safety: only update items in this playlist

        if (error) {
            console.error(`[Playlist] Failed to update position for item ${itemIds[i]}:`, error)
            errors.push(`Item ${itemIds[i]}: ${error.message}`)
        }
    }

    if (errors.length > 0) {
        throw new Error(`Failed to save slide order: ${errors.length} update(s) failed`)
    }

    await cascadeRefreshForPlaylist(supabase, playlistId)

    revalidatePath(`/app/playlists/${playlistId}`)
}

export async function updateItemDuration(playlistId: string, itemId: string, durationSeconds: number) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await verifyPlaylistOwnership(supabase, user.id, playlistId)

    if (durationSeconds < 1 || durationSeconds > 300) {
        throw new Error('Duration must be between 1 and 300 seconds')
    }

    const { error } = await supabase
        .from('display_playlist_items')
        .update({ duration_seconds: durationSeconds })
        .eq('id', itemId)
        .eq('playlist_id', playlistId)

    if (error) throw new Error('Failed to update duration')

    await cascadeRefreshForPlaylist(supabase, playlistId)

    revalidatePath(`/app/playlists/${playlistId}`)
}

// ── Screen Assignment ────────────────────────────────────────

export async function assignPlaylist(screenId: string, playlistId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify screen ownership
    const { data: screen } = await supabase
        .from('display_screens')
        .select('id, refresh_version, store:display_stores(client_id)')
        .eq('id', screenId)
        .single()

    if (!screen) throw new Error('Screen not found')

    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

    const storeClientId = (screen.store as any)?.client_id
    const isSuperAdmin = profile?.role === 'super_admin'
    const isOwner = profile?.role === 'client_admin' && profile.client_id === storeClientId

    if (!isSuperAdmin && !isOwner) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    // Deactivate current content
    await supabase
        .from('display_screen_content')
        .update({ active: false })
        .eq('screen_id', screenId)
        .eq('active', true)

    // Insert new playlist assignment
    const { error } = await supabase.from('display_screen_content').insert({
        screen_id: screenId,
        playlist_id: playlistId,
        active: true,
    })

    if (error) {
        console.error('Failed to assign playlist:', error)
        throw new Error('Failed to assign playlist')
    }

    // Bump refresh version
    const newVersion = (screen.refresh_version || 0) + 1
    await supabase.from('display_screens').update({ refresh_version: newVersion }).eq('id', screenId)

    revalidatePath(`/app/screens/${screenId}`, 'page')
}
