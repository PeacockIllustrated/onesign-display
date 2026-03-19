'use client'

import { useEffect, useState, useRef } from 'react'
import type { SyncPosition } from '@/lib/sync/compute-position'

type SyncConfig = {
    enabled: boolean
    epoch: string
    screen_index: number
    screen_count: number
}

type PlaylistData = {
    id: string
    transition: string
    transition_duration_ms: number
    loop: boolean
    items: { id: string; duration_seconds: number | null }[]
}

type SyncEngineResult = {
    position: SyncPosition | null
    syncedNow: () => number
    isCalibrated: boolean
    clockOffset: number
    getExpectedVideoTime: () => number
}

/**
 * Debug overlay for the player, toggled by pressing Shift+D three times quickly.
 * Shows sync calibration status, clock offset, current position, and video drift.
 * Essential for debugging sync issues on devices without dev tools (FireStick).
 */
export function SyncDebugOverlay({
    syncEngine,
    syncConfig,
    playlist,
}: {
    syncEngine: SyncEngineResult
    syncConfig: SyncConfig | null
    playlist: PlaylistData | null
}) {
    const [visible, setVisible] = useState(false)
    const keypressRef = useRef<number[]>([])

    // Triple Shift+D to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'D' && e.shiftKey) {
                const now = Date.now()
                keypressRef.current.push(now)
                // Keep only presses within the last 1.5 seconds
                keypressRef.current = keypressRef.current.filter(t => now - t < 1500)
                if (keypressRef.current.length >= 3) {
                    setVisible(v => !v)
                    keypressRef.current = []
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Update display every 200ms when visible
    const [, forceUpdate] = useState(0)
    useEffect(() => {
        if (!visible) return
        const timer = setInterval(() => forceUpdate(v => v + 1), 200)
        return () => clearInterval(timer)
    }, [visible])

    if (!visible) return null

    const pos = syncEngine.position
    const now = syncEngine.syncedNow()

    return (
        <div
            className="absolute top-4 left-4 z-50 bg-black/80 text-green-400 font-mono text-xs p-4 rounded-lg border border-green-800 min-w-[280px]"
            style={{ pointerEvents: 'none' }}
        >
            <div className="text-green-300 font-bold mb-2">🔄 Sync Debug</div>

            <div className="space-y-1">
                <Row label="Sync Enabled" value={syncConfig?.enabled ? 'YES' : 'NO'} />
                <Row label="Calibrated" value={syncEngine.isCalibrated ? 'YES' : 'NO'} />
                <Row label="Clock Offset" value={`${syncEngine.clockOffset >= 0 ? '+' : ''}${syncEngine.clockOffset.toFixed(1)}ms`} />

                {syncConfig && (
                    <>
                        <div className="border-t border-green-800 my-2" />
                        <Row label="Screen" value={`${syncConfig.screen_index} of ${syncConfig.screen_count}`} />
                        <Row label="Epoch" value={new Date(syncConfig.epoch).toLocaleTimeString()} />
                    </>
                )}

                {pos && (
                    <>
                        <div className="border-t border-green-800 my-2" />
                        <Row label="Slide" value={`${pos.slideIndex + 1} / ${playlist?.items.length ?? '?'}`} />
                        <Row label="Slide Elapsed" value={`${(pos.slideElapsedMs / 1000).toFixed(1)}s`} />
                        <Row label="In Transition" value={pos.isInTransition ? `YES (${(pos.transitionProgress * 100).toFixed(0)}%)` : 'NO'} />
                        {pos.isInTransition && (
                            <Row label="→ Next Slide" value={`${pos.nextSlideIndex + 1}`} />
                        )}
                        <Row label="Cycle" value={`${(pos.cycleElapsedMs / 1000).toFixed(1)}s / ${(pos.totalCycleMs / 1000).toFixed(1)}s`} />
                    </>
                )}

                {playlist && (
                    <>
                        <div className="border-t border-green-800 my-2" />
                        <Row label="Transition" value={playlist.transition} />
                        <Row label="Duration" value={`${playlist.transition_duration_ms}ms`} />
                        <Row label="Loop" value={playlist.loop ? 'YES' : 'NO'} />
                    </>
                )}

                <div className="border-t border-green-800 mt-2 pt-2 text-green-600">
                    Shift+D ×3 to hide
                </div>
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-green-600">{label}:</span>
            <span className="text-green-300">{value}</span>
        </div>
    )
}
