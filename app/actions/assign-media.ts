'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignMedia(screenId: string, mediaAssetId: string) {
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

    // Check Entitlement
    const { data: media } = await supabase.from('display_media_assets').select('mime, client_id').eq('id', mediaAssetId).single()
    if (media && media.mime.startsWith('video/')) {
        const { getEntitlements, assertEntitlement } = await import('@/lib/auth/getEntitlements.server')
        const entitlements = await getEntitlements(media.client_id)
        assertEntitlement(entitlements, 'video_enabled')
    }

    // 2. Insert new active content
    const { error } = await supabase.from('display_screen_content').insert({
        screen_id: screenId,
        media_asset_id: mediaAssetId,
        active: true
    })

    if (error) {
        console.error('Failed to assign media:', error)
        throw new Error('Failed to assign media')
    }

    // 3. Atomic refresh version increment
    const newVersion = (screen.refresh_version || 0) + 1
    await supabase.from('display_screens').update({ refresh_version: newVersion }).eq('id', screenId)

    revalidatePath(`/app/screens/${screenId}`, 'page')
}
