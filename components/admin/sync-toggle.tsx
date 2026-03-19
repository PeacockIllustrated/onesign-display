'use client'

import { useState, useTransition } from 'react'
import { toggleSync, resetSyncEpoch } from '@/app/actions/screen-set-actions'

export function SyncToggle({
    screenSetId,
    enabled,
    syncEpoch,
}: {
    screenSetId: string
    enabled: boolean
    syncEpoch: string | null
}) {
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)

    const handleToggle = () => {
        if (!enabled) {
            // Enabling: show confirmation
            setShowConfirm(true)
        } else {
            // Disabling: just do it
            startTransition(async () => {
                await toggleSync(screenSetId, false)
            })
        }
    }

    const confirmEnable = () => {
        setShowConfirm(false)
        startTransition(async () => {
            await toggleSync(screenSetId, true)
        })
    }

    const handleReset = () => {
        startTransition(async () => {
            await resetSyncEpoch(screenSetId)
        })
    }

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    enabled
                        ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50`}
            >
                <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`} />
                {isPending ? 'Updating...' : enabled ? 'Sync On' : 'Sync Off'}
            </button>

            {/* Sync status bar (when enabled) */}
            {enabled && (
                <div className="w-full bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-sm text-teal-800 font-medium">Synchronized Playback Active</span>
                    {syncEpoch && (
                        <span className="text-xs text-teal-600">
                            Epoch: {new Date(syncEpoch).toLocaleString()}
                        </span>
                    )}
                    <button
                        onClick={handleReset}
                        disabled={isPending}
                        className="ml-auto text-xs text-teal-700 underline hover:text-teal-900 disabled:opacity-50"
                    >
                        Reset Sync
                    </button>
                </div>
            )}

            {/* Confirmation dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Screen Sync?</h3>
                        <div className="text-sm text-gray-600 space-y-2 mb-4">
                            <p>
                                All screens in this set will synchronize their slide transitions
                                to play in unison.
                            </p>
                            <p className="font-medium text-amber-700">
                                For best results:
                            </p>
                            <ul className="list-disc list-inside text-amber-700 space-y-1">
                                <li>All screens should have playlists with matching durations</li>
                                <li>Video slides must have accurate duration set</li>
                                <li>Enabling sync will restart all screens from slide 1</li>
                            </ul>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEnable}
                                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                            >
                                Enable Sync
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
