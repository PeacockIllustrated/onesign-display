'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignToSchedule(
    scheduleId: string,
    screenId: string,
    mediaId?: string | null,
    playlistId?: string | null,
    streamId?: string | null,
) {
    const supabase = await createClient()

    // Build the content fields — exactly one must be set
    const contentFields: Record<string, string | null> = {
        media_asset_id: mediaId || null,
        playlist_id: playlistId || null,
        stream_id: streamId || null,
    }

    // First, find if an assignment exists for this screen+schedule
    const { data: existing } = await supabase
        .from('display_scheduled_screen_content')
        .select('id')
        .eq('schedule_id', scheduleId)
        .eq('screen_id', screenId)
        .single()

    if (existing) {
        // Update — clear all content fields and set the new one
        await supabase
            .from('display_scheduled_screen_content')
            .update(contentFields)
            .eq('id', existing.id)
    } else {
        // Insert
        await supabase
            .from('display_scheduled_screen_content')
            .insert({
                schedule_id: scheduleId,
                screen_id: screenId,
                ...contentFields,
            })
    }

    revalidatePath(`/app/schedules/${scheduleId}`)
}

export async function removeFromSchedule(assignmentId: string, scheduleId: string) {
    const supabase = await createClient()
    await supabase.from('display_scheduled_screen_content').delete().eq('id', assignmentId)
    revalidatePath(`/app/schedules/${scheduleId}`)
}
