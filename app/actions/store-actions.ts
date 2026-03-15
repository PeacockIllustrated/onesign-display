'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStore(clientId: string, name: string) {
    const supabase = await createSupabaseClient()

    // Check if super admin (or client admin for that client)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isClientAdmin = profile?.role === 'client_admin' && profile.client_id === clientId

    if (!isSuperAdmin && !isClientAdmin) {
        return { error: 'Unauthorized: Insufficient permissions' }
    }

    const { data, error } = await supabase.from('stores')
        .insert({
            client_id: clientId,
            name: name,
            timezone: 'Europe/London' // Default for now
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/app/clients/${clientId}`)
    revalidatePath('/app')
    return { success: true, store: data }
}
