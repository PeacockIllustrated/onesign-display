'use server'

import { createClient } from '@/lib/supabase/server'
import { parseScheduleForm } from '@/lib/schedules'
import { revalidatePath } from 'next/cache'

export async function updateSchedule(scheduleId: string, formData: FormData) {
    const supabase = await createClient()

    if (!scheduleId) {
        throw new Error('Missing required fields')
    }

    const { name, startTime, endTime, days, priority } = parseScheduleForm(formData)

    const { error } = await supabase.from('display_schedules').update({
        name,
        start_time: startTime,
        end_time: endTime,
        days_of_week: days,
        priority
    }).eq('id', scheduleId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath(`/app/schedules/${scheduleId}`)
    revalidatePath('/app/schedules')
}

export async function deleteSchedule(scheduleId: string) {
    const supabase = await createClient()
    await supabase.from('display_schedules').delete().eq('id', scheduleId)
    revalidatePath('/app/schedules')
}
