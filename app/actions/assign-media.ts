'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignMedia(screenId: string, mediaAssetId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Deactivate current active content
    await supabase
        .from('screen_content')
        .update({ active: false })
        .eq('screen_id', screenId)
        .eq('active', true)

    // Check Entitlement (New)
    const { data: media } = await supabase.from('media_assets').select('mime, client_id').eq('id', mediaAssetId).single()
    if (media && media.mime.startsWith('video/')) {
        const { getEntitlements, assertEntitlement } = await import('@/lib/auth/getEntitlements.server')
        const entitlements = await getEntitlements(media.client_id)
        assertEntitlement(entitlements, 'video_enabled')
    }

    // 2. Insert new active content
    const { error } = await supabase.from('screen_content').insert({
        screen_id: screenId,
        media_asset_id: mediaAssetId,
        active: true
    })

    if (error) {
        console.error('Failed to assign media:', error)
        throw new Error('Failed to assign media')
    }

    // 3. Trigger Refresh (Update version)
    // We fetch the screen first to get current version safely or just increment
    // RPC is safer for atomic increment but standard update is fine for this scale
    const { data: screen } = await supabase.from('screens').select('refresh_version').eq('id', screenId).single()
    const newVersion = (screen?.refresh_version || 0) + 1

    await supabase.from('screens').update({ refresh_version: newVersion }).eq('id', screenId)

    revalidatePath(`/app/screens/${screenId}`, 'page')
}
