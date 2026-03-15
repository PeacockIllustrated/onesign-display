'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createScreenSet(storeId: string, name: string) {
    const supabase = await createSupabaseClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user has access to this store (via client_id)
    // We can do a join or optimized query.
    // For now, simpler: get store's client_id, then check user's role/client_id
    const { data: store } = await supabase.from('stores').select('client_id').eq('id', storeId).single()
    if (!store) return { error: 'Store not found' }

    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'
    const isClientAdmin = profile?.role === 'client_admin' && profile.client_id === store.client_id

    if (!isSuperAdmin && !isClientAdmin) {
        return { error: 'Unauthorized: Insufficient permissions' }
    }

    const { data, error } = await supabase.from('screen_sets')
        .insert({
            store_id: storeId,
            name: name
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/app/stores/${storeId}`)
    return { success: true, screenSet: data }
}
