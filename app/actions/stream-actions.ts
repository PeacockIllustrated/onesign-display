'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStream(
    clientId: string,
    name: string,
    streamUrl: string,
    streamType: 'hls' | 'dash' | 'embed',
    audioEnabled: boolean,
    fallbackMediaAssetId?: string | null
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

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

    const { data: stream, error } = await supabase
        .from('display_streams')
        .insert({
            client_id: clientId,
            name,
            stream_url: streamUrl,
            stream_type: streamType,
            audio_enabled: audioEnabled,
            fallback_media_asset_id: fallbackMediaAssetId || null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Failed to create stream:', error)
        throw new Error('Failed to create stream')
    }

    revalidatePath('/app/streams')
    return stream
}

export async function updateStream(
    streamId: string,
    updates: {
        name?: string
        stream_url?: string
        stream_type?: 'hls' | 'dash' | 'embed'
        audio_enabled?: boolean
        fallback_media_asset_id?: string | null
    }
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('display_streams')
        .update(updates)
        .eq('id', streamId)

    if (error) {
        console.error('Failed to update stream:', error)
        throw new Error('Failed to update stream')
    }

    revalidatePath('/app/streams')
}

export async function deleteStream(streamId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('display_streams')
        .delete()
        .eq('id', streamId)

    if (error) {
        console.error('Failed to delete stream:', error)
        throw new Error('Failed to delete stream')
    }

    revalidatePath('/app/streams')
}

export async function assignStream(screenId: string, streamId: string) {
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

    // 1. Deactivate current active content
    await supabase
        .from('display_screen_content')
        .update({ active: false })
        .eq('screen_id', screenId)
        .eq('active', true)

    // 2. Insert new active content with stream
    const { error } = await supabase.from('display_screen_content').insert({
        screen_id: screenId,
        stream_id: streamId,
        active: true,
    })

    if (error) {
        console.error('Failed to assign stream:', error)
        throw new Error('Failed to assign stream')
    }

    // 3. Atomic refresh version increment
    const newVersion = (screen.refresh_version || 0) + 1
    await supabase.from('display_screens').update({ refresh_version: newVersion }).eq('id', screenId)

    revalidatePath(`/app/screens/${screenId}`, 'page')
}
