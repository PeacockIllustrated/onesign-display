'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ... (imports)

export async function addScreen(formData: FormData) {
    const supabase = await createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 2. Parse Data
    const screenSetId = formData.get('screen_set_id') as string
    const name = formData.get('name') as string
    const orientation = formData.get('orientation') as string || 'landscape'
    const displayType = formData.get('display_type') as string || 'pc'

    if (!screenSetId || !name) {
        throw new Error('Missing required fields')
    }

    // 3. Fetch Context & Check Permissions
    const { data: screenSet } = await supabase.from('screen_sets')
        .select('*, store:stores(client_id)')
        .eq('id', screenSetId)
        .single()

    if (!screenSet) throw new Error('Screen Set not found')

    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()

    // @ts-ignore - Supabase types might not infer the join perfectly
    const storeClientId = screenSet.store?.client_id
    const isSuperAdmin = profile?.role === 'super_admin'
    const isClientAdmin = profile?.role === 'client_admin' && profile.client_id === storeClientId

    if (!isSuperAdmin && !isClientAdmin) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    // 4. ENTITLEMENT CHECK (New)
    // Only check limits for Client Admins (Super Admins bypass)
    // Or maybe Super Admins should be warned but allowed? Specification says:
    // "Manageable (Super Admin can manage plans/limits per client)"
    // "UI behaviour when over limit... Block pairing new screens"
    // Usually Super Admin override is implied or explicit. 
    // Let's enforce for everyone based on the CLIENT's plan, so it's consistent. 
    // If Super Admin wants to add more, they should up the limit.
    const { getEntitlements } = await import('@/lib/auth/getEntitlements.server');
    const { assertWithinScreenLimit } = await import('@/lib/slate/limits');

    // We need entitlements for the STORE'S client, not necessarily the acting user (though they match for client_admin)
    // IMPORTANT: getEntitlements() gets the CURRENT USER's entitlement.
    // If Super Admin is acting, getEntitlements returns standard/admin entitlement which might be irrelevant.
    // We need to check the TARGET CLIENT's entitlement.

    let targetClientId = storeClientId;

    // If we rely on getEntitlements() which uses auth.getUser(), it works for Client Admin.
    // For Super Admin, we might need to manually fetch the client's plan.
    // But assertWithinScreenLimit takes a clientId.
    // So we just need the entitlements object.

    // Let's make a clear helper or just fetch manually here if Super Admin.
    // Or better: getEntitlements() could optionally take a client_id override for Super Admins?
    // The current implementation of getEntitlements uses profile.client_id.

    // Let's compromise: If Client Admin, use getEntitlements. 
    // If Super Admin, fetch plan manually for targetClientId.

    // Actually, let's just fetch the plan for targetClientId directly from DB using admin privileges here (since we have logic).
    // Or simpler: add a helper `getClientEntitlements(clientId)` in `getEntitlements.server.ts`?
    // I'll stick to `getEntitlements` for now, assuming Client Admin is the primary user.
    // If Super Admin, we'll skip the check or enforce it if we can easily.

    if (isClientAdmin) {
        const entitlements = await getEntitlements();
        await assertWithinScreenLimit(targetClientId, entitlements);
    } else if (isSuperAdmin) {
        // Optional: Enforce for Super Admin too? "Manageable" implies they change the plan. 
        // If they try to add a screen to a capped client, they should probably see the error or bump the plan first.
        // Let's fetch plan for target client.
        const { data: plan } = await supabase.from('client_plans').select('*').eq('client_id', targetClientId).single();
        if (plan) { // If no plan, assume safe default or skip
            // Use the PLAN_DEFS helper if needed or just cast
            const { PLAN_DEFS } = await import('@/lib/slate/plans'); // dynamic import to avoid circular if any/cleanup
            // Actually just simple cast
            const entitlements = {
                plan_code: plan.plan_code as any,
                status: plan.status as any,
                max_screens: plan.max_screens,
                video_enabled: plan.video_enabled,
                specials_studio_enabled: plan.specials_studio_enabled,
                scheduling_enabled: plan.scheduling_enabled,
                four_k_enabled: plan.four_k_enabled,
                design_package_included: plan.design_package_included,
                managed_design_support: plan.managed_design_support,
            };
            await assertWithinScreenLimit(targetClientId, entitlements);
        }
    }

    // 5. Insert Screen
    const token = `token-${Math.random().toString(36).substring(2, 10)}`

    const { error } = await supabase.from('screens').insert({
        screen_set_id: screenSetId,
        store_id: screenSet.store_id,
        name,
        orientation,
        display_type: displayType,
        player_token: token,
        index_in_set: 99
    })

    if (error) {
        console.error('Failed to add screen:', error)
        throw new Error(error.message || 'Failed to add screen')
    }

    revalidatePath(`/app/screen-sets/${screenSetId}`)
}

export async function updateScreen(screenId: string, formData: FormData) {
    const supabase = await createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 2. Fetch Screen & Context
    const { data: screen } = await supabase.from('screens')
        .select('*, store:stores(client_id)')
        .eq('id', screenId)
        .single()

    if (!screen) throw new Error('Screen not found')

    // 3. Check Permissions
    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()

    // @ts-ignore
    const storeClientId = screen.store?.client_id
    const isSuperAdmin = profile?.role === 'super_admin'
    const isClientAdmin = profile?.role === 'client_admin' && profile.client_id === storeClientId

    if (!isSuperAdmin && !isClientAdmin) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    // 4. Update
    const name = formData.get('name') as string
    const orientation = formData.get('orientation') as string
    const displayType = formData.get('display_type') as string

    const { error } = await supabase.from('screens').update({
        name,
        orientation,
        display_type: displayType
    }).eq('id', screenId)

    if (error) {
        console.error('Failed to update screen:', error)
        throw new Error('Failed to update screen')
    }

    revalidatePath(`/app/screens/${screenId}`)
}

export async function deleteScreen(screenId: string, screenSetId: string) {
    const supabase = await createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 2. Fetch Screen & Context
    const { data: screen } = await supabase.from('screens')
        .select('*, store:stores(client_id)')
        .eq('id', screenId)
        .single()

    if (!screen) throw new Error('Screen not found')

    // 3. Check Permissions
    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()

    // @ts-ignore
    const storeClientId = screen.store?.client_id
    const isSuperAdmin = profile?.role === 'super_admin'
    const isClientAdmin = profile?.role === 'client_admin' && profile.client_id === storeClientId

    if (!isSuperAdmin && !isClientAdmin) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    // 4. Delete
    const { error } = await supabase.from('screens').delete().eq('id', screenId)

    if (error) {
        console.error('Failed to delete screen:', error)
        throw new Error('Failed to delete screen')
    }

    revalidatePath(`/app/screen-sets/${screenSetId}`)
    redirect(`/app/screen-sets/${screenSetId}`)
}
