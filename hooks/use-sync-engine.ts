'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { computeSyncPosition, type SyncPosition } from '@/lib/sync/compute-position'

// ── Types ────────────────────────────────────────────────────

type SyncConfig = {
    epoch: string
    screen_index: number
    screen_count: number
}

type PlaylistData = {
    id: string
    transition: 'fade' | 'cut' | 'slide_left' | 'slide_right'
    transition_duration_ms: number
    loop: boolean
    items: { id: string; duration_seconds: number | null }[]
}

type SyncEngineResult = {
    /** Current computed position — null if sync disabled or not calibrated */
    position: SyncPosition | null
    /** Returns calibrated server time in ms */
    syncedNow: () => number
    /** Whether clock calibration is complete */
    isCalibrated: boolean
    /** Clock offset in ms (positive = local clock is behind server) */
    clockOffset: number
    /** Get expected video currentTime for a given slide index */
    getExpectedVideoTime: () => number
}

// ── Clock Calibration ────────────────────────────────────────

type ClockSample = {
    offset: number
    rtt: number
}

async function takeSample(token: string): Promise<ClockSample | null> {
    try {
        const t1 = Date.now()
        const res = await fetch(`/api/player/clock?token=${token}`)
        const t2 = Date.now()

        if (!res.ok) return null

        const data = await res.json()
        const rtt = t2 - t1
        const estimatedServerTime = data.server_time + rtt / 2
        const offset = estimatedServerTime - t2

        return { offset, rtt }
    } catch {
        return null
    }
}

function medianOffset(samples: ClockSample[]): number {
    const offsets = samples.map(s => s.offset).sort((a, b) => a - b)
    const mid = Math.floor(offsets.length / 2)
    if (offsets.length % 2 === 0) {
        return (offsets[mid - 1] + offsets[mid]) / 2
    }
    return offsets[mid]
}

async function calibrateClock(token: string): Promise<{ offset: number; rtt: number } | null> {
    const samples: ClockSample[] = []

    for (let i = 0; i < 5; i++) {
        const sample = await takeSample(token)
        if (sample) samples.push(sample)
        // Small delay between samples to avoid burst issues
        if (i < 4) await new Promise(r => setTimeout(r, 100))
    }

    if (samples.length < 3) return null // Need at least 3 good samples

    const offset = medianOffset(samples)
    const medianRtt = samples
        .map(s => s.rtt)
        .sort((a, b) => a - b)[Math.floor(samples.length / 2)]

    return { offset, rtt: medianRtt }
}

// ── Constants ────────────────────────────────────────────────

const RECALIBRATE_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const IDLE_CHECK_INTERVAL_MS = 200 // Check position every 200ms when not transitioning
const TRANSITION_LOOKAHEAD_MS = 50 // Switch to rAF this many ms before transition

// ── Hook ─────────────────────────────────────────────────────

export function useSyncEngine(
    syncConfig: SyncConfig | null,
    playlist: PlaylistData | null,
    token: string,
): SyncEngineResult {
    const [clockOffset, setClockOffset] = useState(0)
    const [isCalibrated, setIsCalibrated] = useState(false)
    const [position, setPosition] = useState<SyncPosition | null>(null)

    const clockOffsetRef = useRef(0)
    const calibratedRef = useRef(false)

    // Keep refs in sync with state
    useEffect(() => { clockOffsetRef.current = clockOffset }, [clockOffset])
    useEffect(() => { calibratedRef.current = isCalibrated }, [isCalibrated])

    const syncedNow = useCallback(() => {
        return Date.now() + clockOffsetRef.current
    }, [])

    // ── Clock Calibration ────────────────────────────────────

    useEffect(() => {
        if (!syncConfig) {
            setIsCalibrated(false)
            setPosition(null)
            return
        }

        let cancelled = false

        const doCalibrate = async () => {
            const result = await calibrateClock(token)
            if (cancelled) return

            if (result) {
                clockOffsetRef.current = result.offset
                setClockOffset(result.offset)
                calibratedRef.current = true
                setIsCalibrated(true)
                console.log(
                    `[Sync] Clock calibrated: offset=${result.offset.toFixed(1)}ms, ` +
                    `RTT=${result.rtt}ms`
                )
            } else {
                // Fallback: use offset of 0 (rely on device clock)
                console.warn('[Sync] Clock calibration failed — using local clock')
                calibratedRef.current = true
                setIsCalibrated(true)
            }
        }

        doCalibrate()

        // Recalibrate periodically
        const recalTimer = setInterval(doCalibrate, RECALIBRATE_INTERVAL_MS)

        return () => {
            cancelled = true
            clearInterval(recalTimer)
        }
    }, [syncConfig?.epoch, token]) // Re-calibrate if epoch changes (new sync session)

    // ── Position Computation Loop ────────────────────────────

    useEffect(() => {
        if (!syncConfig || !playlist || !calibratedRef.current) return
        if (!isCalibrated) return // Wait for state to catch up

        const epochMs = new Date(syncConfig.epoch).getTime()
        let rafId: number | null = null
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        let running = true

        const compute = () => {
            if (!running) return

            const now = Date.now() + clockOffsetRef.current
            const pos = computeSyncPosition(
                now,
                epochMs,
                playlist.items,
                playlist.transition_duration_ms,
                playlist.loop,
                playlist.transition,
            )

            setPosition(pos)

            // Determine next check timing:
            // - During transitions: use rAF for smooth animation
            // - During display phase: use setTimeout for efficiency
            // - Before transitions: use rAF when approaching within TRANSITION_LOOKAHEAD_MS
            if (pos.isInTransition) {
                // In transition — animate every frame
                rafId = requestAnimationFrame(compute)
            } else {
                // In display phase — compute time until next transition
                const currentSegmentDisplayMs = (playlist.items[pos.slideIndex]?.duration_seconds ?? 10) * 1000
                const msUntilTransition = currentSegmentDisplayMs - pos.slideElapsedMs

                if (msUntilTransition <= TRANSITION_LOOKAHEAD_MS) {
                    // About to transition — switch to rAF
                    rafId = requestAnimationFrame(compute)
                } else {
                    // Comfortably in display phase — check at idle rate
                    // But don't sleep longer than the time until transition starts
                    const checkDelay = Math.min(IDLE_CHECK_INTERVAL_MS, msUntilTransition - TRANSITION_LOOKAHEAD_MS)
                    timeoutId = setTimeout(compute, Math.max(16, checkDelay))
                }
            }
        }

        compute()

        return () => {
            running = false
            if (rafId !== null) cancelAnimationFrame(rafId)
            if (timeoutId !== null) clearTimeout(timeoutId)
        }
    }, [syncConfig?.epoch, playlist?.id, playlist?.transition, playlist?.transition_duration_ms, playlist?.loop, isCalibrated])

    // ── Video Seek Helper ────────────────────────────────────

    const getExpectedVideoTime = useCallback(() => {
        if (!position) return 0
        return position.slideElapsedMs / 1000
    }, [position])

    // ── Return ───────────────────────────────────────────────

    // When sync is disabled, return null position
    if (!syncConfig) {
        return {
            position: null,
            syncedNow,
            isCalibrated: false,
            clockOffset: 0,
            getExpectedVideoTime: () => 0,
        }
    }

    return {
        position,
        syncedNow,
        isCalibrated,
        clockOffset,
        getExpectedVideoTime,
    }
}
