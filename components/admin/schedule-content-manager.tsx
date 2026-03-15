'use client'

import { useState } from 'react'
import { SignedImage } from '@/components/ui/signed-image'
import { assignToSchedule, removeFromSchedule } from '@/app/actions/manage-schedule'
import { X, Plus, Trash2 } from 'lucide-react'

type Props = {
    scheduleId: string
    screens: { id: string, name: string }[]
    media: { id: string, storage_path: string, filename: string }[]
    assignments: any[]
}

export function ScheduleContentManager({ scheduleId, screens, media, assignments }: Props) {
    // State for the modal picker
    const [pickingForScreen, setPickingForScreen] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const getAssignment = (screenId: string) => assignments.find(a => a.screen_id === screenId)
    const getMedia = (mediaId: string) => media.find(m => m.id === mediaId)

    const handleAssign = async (mediaId: string) => {
        if (!pickingForScreen) return
        setSubmitting(true)
        try {
            await assignToSchedule(scheduleId, pickingForScreen, mediaId)
            setPickingForScreen(null)
        } catch (e) {
            console.error(e)
            alert('Failed to assign')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemove = async (assignmentId: string) => {
        if (!confirm('Remove this content from the schedule?')) return
        setSubmitting(true)
        try {
            await removeFromSchedule(assignmentId, scheduleId)
        } catch (e) {
            alert('Failed to remove')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            {screens.length === 0 ? (
                <div className="text-gray-500 font-style-italic">No screens in this store.</div>
            ) : (
                <div className="grid gap-4">
                    {screens.map(screen => {
                        const assignment = getAssignment(screen.id)
                        const assignedMedia = assignment ? getMedia(assignment.media_asset_id) : null

                        return (
                            <div key={screen.id} className="flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors">
                                <div>
                                    <h4 className="font-bold text-zinc-900 text-sm mb-0.5">{screen.name}</h4>
                                    <p className="text-xs text-zinc-500 font-medium">
                                        {assignment ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Content Assigned
                                            </span>
                                        ) : 'Using Default Content'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    {assignedMedia ? (
                                        <div className="flex items-center gap-3 bg-white p-2 pr-3 rounded border border-zinc-200 shadow-sm">
                                            <div className="w-8 h-8 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                                                <SignedImage path={assignedMedia.storage_path} alt="Thumb" className="object-cover w-full h-full" />
                                            </div>
                                            <div className="text-xs font-medium max-w-[120px] truncate">{assignedMedia.filename}</div>
                                            <button
                                                onClick={() => handleRemove(assignment.id)}
                                                disabled={submitting}
                                                className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                                title="Remove content"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPickingForScreen(screen.id)}
                                            className="text-xs font-bold uppercase tracking-wide bg-zinc-900 text-white px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                                        >
                                            <Plus size={14} /> Assign
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Media Picker Modal */}
            {pickingForScreen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold">Select Media</h3>
                            <button onClick={() => setPickingForScreen(null)}><X /></button>
                        </div>
                        <div className="p-4 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {media.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleAssign(m.id)}
                                    disabled={submitting}
                                    className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-black focus:outline-none"
                                >
                                    <SignedImage path={m.storage_path} alt={m.filename} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 truncate">
                                        {m.filename}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
