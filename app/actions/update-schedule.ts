'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSchedule(scheduleId: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const days = formData.getAll('days').map(d => parseInt(d as string))

    if (!scheduleId || !name || !startTime || !endTime || days.length === 0) {
        throw new Error('Missing required fields')
    }

    const { error } = await supabase.from('schedules').update({
        name,
        start_time: startTime,
        end_time: endTime,
        days_of_week: days
    }).eq('id', scheduleId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath(`/app/schedules/${scheduleId}`)
    revalidatePath('/app/schedules')
}

export async function deleteSchedule(scheduleId: string) {
    const supabase = await createClient()
    await supabase.from('schedules').delete().eq('id', scheduleId)
    revalidatePath('/app/schedules')
}
