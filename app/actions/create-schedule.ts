'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSchedule(storeId: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    // Days are checkboxes, so we need to collect them
    const days = formData.getAll('days').map(d => parseInt(d as string))

    if (!storeId || !name || !startTime || !endTime || days.length === 0) {
        throw new Error('Missing required fields')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // RLS handles permission checks, but good to be explicit if needed.
    // We trust RLS "Manage schedules": check if store belongs to user's client.

    const { data, error } = await supabase.from('schedules').insert({
        store_id: storeId,
        name,
        start_time: startTime,
        end_time: endTime,
        days_of_week: days,
        priority: 10 // Default priority
    }).select().single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/app/schedules')
    redirect(`/app/schedules/${data.id}`)
}
