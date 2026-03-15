import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ScheduleContentManager } from '@/components/admin/schedule-content-manager'
import { EditScheduleForm } from '@/components/admin/edit-schedule-form'

export default async function ScheduleDetailPage({ params }: { params: Promise<{ scheduleId: string }> }) {
    const { scheduleId } = await params
    const supabase = await createClient()

    const { data: schedule } = await supabase.from('schedules').select('*, store:stores(id, name, client_id)').eq('id', scheduleId).single()
    if (!schedule) return notFound()

    // Fetch Screens in this store
    const { data: screens } = await supabase.from('screens').select('id, name').eq('store_id', schedule.store_id).order('name')

    // Fetch Media in this client
    const { data: media } = await supabase.from('media_assets').select('*').eq('client_id', schedule.store.client_id)

    // Fetch existing assignments
    const { data: assignments } = await supabase.from('scheduled_screen_content').select('*').eq('schedule_id', scheduleId)

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <Link href="/app/schedules" className="text-xs text-zinc-500 hover:text-zinc-900 mb-2 block transition-colors">&larr; Back to Schedules</Link>
                    <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">{schedule.name}</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">
                        {schedule.store.name} • {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Content Assignment */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-6">
                    <h2 className="text-lg font-bold text-zinc-900 mb-4">Content Assignment</h2>
                    <p className="text-zinc-500 text-sm mb-6">
                        Assign specific media to screens during this time block.
                        If a screen is not assigned content here, it will fall back to its Default/Active content.
                    </p>

                    <ScheduleContentManager
                        scheduleId={scheduleId}
                        screens={screens || []}
                        media={media || []}
                        assignments={assignments || []}
                    />
                </div>

                {/* Settings */}
                <div className="bg-white rounded-lg border border-zinc-200 p-6 h-fit">
                    <h2 className="text-lg font-bold text-zinc-900 mb-4">Settings</h2>
                    <EditScheduleForm schedule={schedule} />
                </div>
            </div>
        </div>
    )
}
