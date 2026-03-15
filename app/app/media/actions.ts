'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteMediaAsset(assetId: string, storagePath: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    try {
        // 1. Check User Permissions
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Unauthorized');

        const { data: profile } = await supabase
            .from('display_profiles')
            .select('role, client_id')
            .eq('id', user.id)
            .single();

        if (!profile) throw new Error('Profile not found');

        // 2. Get Asset Metadata (to check ownership)
        // Use admin client to ensure we can read it even if RLS is strict
        const { data: asset, error: fetchError } = await adminClient
            .from('display_media_assets')
            .select('client_id')
            .eq('id', assetId)
            .single();

        if (fetchError || !asset) throw new Error('Asset not found');

        // 3. Verify Ownership / Role
        const isSuperAdmin = profile.role === 'super_admin';
        const isOwnerAdmin = profile.role === 'client_admin' && profile.client_id === asset.client_id;

        if (!isSuperAdmin && !isOwnerAdmin) {
            throw new Error('Unauthorized: Insufficient permissions to delete this asset');
        }

        // 4. Delete from Storage (using Admin Client)
        const { error: storageError } = await adminClient.storage
            .from('onesign-display')
            .remove([storagePath]);

        if (storageError) {
            console.error('Storage Delete Error:', storageError);
            throw new Error('Failed to delete file from storage');
        }

        // 5. Delete from DB (using Admin Client)
        const { error: dbError } = await adminClient
            .from('display_media_assets')
            .delete()
            .eq('id', assetId);

        if (dbError) {
            console.error('DB Delete Error:', dbError);
            // Ideally should rollback storage deletion? Hard to do with simple remove.
            // Just log it.
            throw new Error('Failed to delete record from database');
        }

        revalidatePath('/app/media');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
// ... existing imports
// import { createAdminClient } from '@/lib/supabase/server'; // REMOVE THIS LINE


export async function registerMediaAsset(
    clientId: string,
    filename: string,
    storagePath: string,
    mimeType: string,
    size: number,
    uploaderId: string,
    storeId?: string | null
) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    try {
        // Check Entitlement (New)
        if (mimeType.startsWith('video/') || filename.match(/\.(mp4|mov|webm)$/i)) {
            // Since this action accepts clientId, we should verify it matches the user 
            // IF we rely on getEntitlements() which uses auth.getUser().
            // If this action is called by super admin for a client, getEntitlements() might fail or return admin plan.
            // We can use the clientId passed in to check the plan directly if super admin, 
            // or just rely on getEntitlements() if it's the user acting.
            // Given the context is likely "User Uploading", getEntitlements is correct.
            const { getEntitlements, assertEntitlement } = await import('@/lib/auth/getEntitlements.server')
            // Pass clientId as override to allow super admins to upload on behalf of client
            const entitlements = await getEntitlements(clientId)
            assertEntitlement(entitlements, 'video_enabled')
        }

        // 1. Create DB Record
        const { data: asset, error: dbError } = await supabase
            .from('display_media_assets')
            .insert({
                client_id: clientId,
                store_id: storeId || null,
                uploader_id: uploaderId,
                filename: filename,
                storage_path: storagePath,
                mime: mimeType,
                bytes: size
            })
            .select()
            .single();

        if (dbError) throw new Error(`DB Error: ${dbError.message}`);

        // 2. Auto-Assignment Logic (Ported from Ingest API)
        const name = filename.toLowerCase();
        let assignedScreenIndex = null;
        let assignedOrientation = null;

        if (name.includes('screen_1_')) assignedScreenIndex = 1;
        else if (name.includes('screen_2_')) assignedScreenIndex = 2;
        else if (name.includes('screen_3_')) assignedScreenIndex = 3;
        else if (name.includes('screen_4_')) assignedScreenIndex = 4;

        if (name.includes('vertical') || name.includes('screen_v_')) assignedOrientation = 'portrait';

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('onesign-display').getPublicUrl(storagePath);

        let resultStatus = 'uploaded';
        let assignedScreenId = null;

        if (storeId && (assignedScreenIndex || assignedOrientation)) {
            let query = supabase.from('display_screens').select('id, refresh_version').eq('store_id', storeId);

            if (assignedScreenIndex) query = query.eq('index_in_set', assignedScreenIndex).eq('orientation', 'landscape');
            else if (assignedOrientation) query = query.eq('orientation', assignedOrientation);

            const { data: screens } = await query;

            if (screens && screens.length > 0) {
                const targetScreen = screens[0];

                // Deactivate old active content
                await supabase.from('display_screen_content').update({ active: false }).eq('screen_id', targetScreen.id);

                // Insert new active content
                await supabase.from('display_screen_content').insert({
                    screen_id: targetScreen.id,
                    media_asset_id: asset.id,
                    active: true
                });

                // Increment Refresh Version
                await supabase.from('display_screens').update({ refresh_version: (targetScreen.refresh_version || 0) + 1 }).eq('id', targetScreen.id);

                resultStatus = 'assigned';
                assignedScreenId = targetScreen.id;
            } else {
                resultStatus = 'uploaded_no_screen_match';
            }
        }

        revalidatePath('/app/media');
        return {
            success: true,
            asset,
            status: resultStatus,
            screenId: assignedScreenId,
            publicUrl
        };

    } catch (e: any) {
        console.error('Register Asset Error:', e);
        return { success: false, error: e.message };
    }
}
