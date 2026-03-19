'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('display_profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/app', 'layout')
    return { success: true }
}

export async function createStoreForOnboarding(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('display_profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

    if (!profile?.client_id) return { error: 'No client found' }

    const { data: store, error } = await supabase
        .from('display_stores')
        .insert({ client_id: profile.client_id, name, timezone: 'Europe/London' })
        .select('id')
        .single()

    if (error) return { error: error.message }

    revalidatePath('/app')
    return { success: true, storeId: store.id }
}

export async function createScreenSetForOnboarding(storeId: string, name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: screenSet, error } = await supabase
        .from('display_screen_sets')
        .insert({ store_id: storeId, name })
        .select('id')
        .single()

    if (error) return { error: error.message }

    revalidatePath('/app')
    return { success: true, screenSetId: screenSet.id }
}
