'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function refreshScreens(screenSetId?: string, storeId?: string) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    let query = supabase.from('screens').select('id, refresh_version')

    if (screenSetId) {
        query = query.eq('screen_set_id', screenSetId)
    } else if (storeId) {
        query = query.eq('store_id', storeId)
    } else {
        return { error: 'Missing target' }
    }

    const { data: screens } = await query

    if (screens?.length) {
        // Increment version
        // We can do a raw SQL but supabase-js works too
        const updates = screens.map(s => ({
            id: s.id,
            refresh_version: (s.refresh_version || 0) + 1
        }))

        const { error } = await supabase.from('screens').upsert(updates)
        if (error) return { error: error.message }

        // Audit Log
        await supabase.from('audit_log').insert({
            actor_id: user.id,
            entity: 'screens',
            entity_id: screenSetId || storeId, // using set or store id as proxy
            action: 'manual_refresh',
            details: { count: screens.length }
        })
    }

    revalidatePath('/app')
    return { success: true }
}
