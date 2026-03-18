'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSchedule(storeId: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const days = formData.getAll('days').map(d => parseInt(d as string))

    if (!storeId || !name || !startTime || !endTime || days.length === 0) {
        throw new Error('Missing required fields')
    }

    // Validate time format (HH:MM or HH:MM:SS)
    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
        throw new Error('Invalid time format')
    }

    // Validate days are 0-6
    if (days.some(d => isNaN(d) || d < 0 || d > 6)) {
        throw new Error('Invalid day values')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify store ownership
    const { data: store } = await supabase
        .from('display_stores')
        .select('id, client_id')
        .eq('id', storeId)
        .single()

    if (!store) throw new Error('Store not found')

    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

    const isSuperAdmin = profile?.role === 'super_admin'
    const isOwner = profile?.role === 'client_admin' && profile.client_id === store.client_id

    if (!isSuperAdmin && !isOwner) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    const { data, error } = await supabase.from('display_schedules').insert({
        store_id: storeId,
        name,
        start_time: startTime,
        end_time: endTime,
        days_of_week: days,
        priority: 10
    }).select().single()

    if (error) {
        throw new Error('Failed to create schedule')
    }

    revalidatePath('/app/schedules')
    redirect(`/app/schedules/${data.id}`)
}
