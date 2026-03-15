'use client'

import { useState } from 'react'
import { createSchedule } from '@/app/actions/create-schedule'
import { X, Calendar, Clock } from 'lucide-react'

const DAYS = [
    { id: 0, label: 'Sun' },
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
]

export function CreateScheduleButton({ stores }: { stores: { id: string, name: string }[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedStore, setSelectedStore] = useState(stores.length === 1 ? stores[0].id : '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            await createSchedule(selectedStore, formData)
            setIsOpen(false)
        } catch (e: any) {
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
            >
                <Calendar size={16} /> New Schedule
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Create Schedule</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black">
                                <X size={20} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Store</label>
                                <select
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                    className="w-full border-zinc-300 rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                    required
                                >
                                    <option value="">Select a Store</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Schedule Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="e.g. Breakfast Menu"
                                    className="w-full border-zinc-300 rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Days Active</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => (
                                        <label key={day.id} className="flex items-center space-x-2 bg-zinc-50 px-3 py-2 rounded border border-zinc-200 cursor-pointer hover:border-zinc-400 font-medium">
                                            <input type="checkbox" name="days" value={day.id} defaultChecked className="rounded text-black focus:ring-black border-zinc-300" />
                                            <span className="text-sm text-zinc-700">{day.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        name="startTime"
                                        type="time"
                                        defaultValue="09:00"
                                        className="w-full border-zinc-300 rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        name="endTime"
                                        type="time"
                                        defaultValue="17:00"
                                        className="w-full border-zinc-300 rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !selectedStore}
                                    className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
