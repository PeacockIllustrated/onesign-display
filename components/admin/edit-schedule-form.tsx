'use client'

import { useState } from 'react'
import { updateSchedule, deleteSchedule } from '@/app/actions/update-schedule'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'

const DAYS = [
    { id: 0, label: 'Sun' },
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
]

type Schedule = {
    id: string
    name: string
    start_time: string
    end_time: string
    days_of_week: number[]
}

export function EditScheduleForm({ schedule }: { schedule: Schedule }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleUpdate = async (formData: FormData) => {
        setLoading(true)
        try {
            await updateSchedule(schedule.id, formData)
            alert('Schedule updated')
        } catch (e: any) {
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this schedule?')) return
        try {
            await deleteSchedule(schedule.id)
            router.push('/app/schedules')
        } catch (e: any) {
            alert(e.message)
        }
    }

    return (
        <form action={handleUpdate} className="space-y-6">
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Schedule Name</label>
                <input
                    name="name"
                    type="text"
                    defaultValue={schedule.name}
                    className="w-full border-zinc-300 rounded-md bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:ring-black focus:outline-none transition-colors placeholder:text-zinc-400"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Days Active</label>
                <div className="flex flex-wrap gap-3">
                    {DAYS.map(day => (
                        <div key={day.id} className="flex items-center">
                            <Checkbox
                                id={`day-${day.id}`}
                                name="days"
                                value={day.id}
                                defaultChecked={schedule.days_of_week.includes(day.id)}
                                label={day.label}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Start Time</label>
                    <input
                        name="startTime"
                        type="time"
                        defaultValue={schedule.start_time}
                        className="w-full border-zinc-300 rounded-md bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:ring-black focus:outline-none transition-colors"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">End Time</label>
                    <input
                        name="endTime"
                        type="time"
                        defaultValue={schedule.start_time.split(':').length === 3 ? schedule.end_time : schedule.end_time + ':00'}
                        key={schedule.end_time}
                        className="w-full border-zinc-300 rounded-md bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:ring-black focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-zinc-100 mt-6">
                <button
                    type="button"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    Delete Schedule
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-6 py-2 rounded text-sm font-bold uppercase tracking-wide hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}
