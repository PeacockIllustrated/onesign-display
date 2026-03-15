'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClient(name: string, slug: string) {
    const supabase = await createSupabaseClient()

    // Check if super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify role (security check)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return { error: 'Unauthorized: Super Admin only' }

    const { data, error } = await supabase.from('clients').insert({ name, slug }).select().single()

    if (error) {
        if (error.code === '23505') return { error: 'Client slug already exists' }
        return { error: error.message }
    }

    revalidatePath('/app')
    return { success: true, client: data }
}
