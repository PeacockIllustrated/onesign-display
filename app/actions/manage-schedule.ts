'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignToSchedule(scheduleId: string, screenId: string, mediaId: string) {
    const supabase = await createClient()

    // Upsert logic? Table has ID. 
    // We should check if an assignment exists for this screen+schedule.
    // If mediaId is provided, upsert. If null/empty, delete?

    // First, find if exists
    const { data: existing } = await supabase
        .from('scheduled_screen_content')
        .select('id')
        .eq('schedule_id', scheduleId)
        .eq('screen_id', screenId)
        .single()

    if (existing) {
        // Update
        await supabase
            .from('scheduled_screen_content')
            .update({ media_asset_id: mediaId })
            .eq('id', existing.id)
    } else {
        // Insert
        await supabase
            .from('scheduled_screen_content')
            .insert({
                schedule_id: scheduleId,
                screen_id: screenId,
                media_asset_id: mediaId
            })
    }

    revalidatePath(`/app/schedules/${scheduleId}`)
}

export async function removeFromSchedule(assignmentId: string, scheduleId: string) {
    const supabase = await createClient()
    await supabase.from('scheduled_screen_content').delete().eq('id', assignmentId)
    revalidatePath(`/app/schedules/${scheduleId}`)
}
