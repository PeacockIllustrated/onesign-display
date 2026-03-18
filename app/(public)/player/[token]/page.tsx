'use client'

import { useEffect, useState, useRef, useCallback, use } from 'react'
import { NeverSleepGuard } from '@/components/player/never-sleep-guard'

type Manifest = {
    screen_id: string
    refresh_version: number
    media: {
        id: string | null
        url: string | null
        type: string | null
    }
    next_check: string | null
    fetched_at: string
}

// Signed URLs expire after 1 hour — refresh before that
const URL_REFRESH_MS = 45 * 60 * 1000 // 45 minutes

export default function PlayerPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [mediaError, setMediaError] = useState(false)
    const [cursorHidden, setCursorHidden] = useState(false)

    // Refs to avoid stale closures in intervals/timeouts
    const manifestRef = useRef<Manifest | null>(null)
    const refreshVersionRef = useRef<number>(-1)
    const retryCountRef = useRef(0)

    // Keep refs in sync with state
    useEffect(() => {
        manifestRef.current = manifest
        if (manifest) refreshVersionRef.current = manifest.refresh_version
    }, [manifest])

    // Polling Config
    const POLL_INTERVAL_MS = 30000 // 30s for schedule transitions
    const HEARTBEAT_INTERVAL_MS = 60000
    const MAX_RETRY_DELAY_MS = 120000 // Cap backoff at 2 minutes

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`/api/player/manifest?token=${token}`)
            if (res.status === 429) return // Rate limited — back off silently
            if (res.status >= 400 && res.status < 500) {
                // Client error (401, 403, etc.) — won't resolve with retries
                if (!manifestRef.current) {
                    setError('Invalid token')
                }
                return
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`) // 5xx → retry
            const data = await res.json()
            setManifest(data)
            setError(null)
            setMediaError(false)
            retryCountRef.current = 0
            localStorage.setItem(`onesign_manifest_${token}`, JSON.stringify(data))
        } catch (err) {
            // Network error or 5xx — retry with backoff
            retryCountRef.current++

            if (!manifestRef.current) {
                setError('Offline')
                const cached = localStorage.getItem(`onesign_manifest_${token}`)
                if (cached) {
                    try {
                        setManifest(JSON.parse(cached))
                    } catch { /* corrupt cache, ignore */ }
                }
            }

            // Exponential backoff retry (only when no manifest loaded yet)
            if (!manifestRef.current) {
                const delay = Math.min(
                    (2 ** retryCountRef.current) * 1000,
                    MAX_RETRY_DELAY_MS
                )
                setTimeout(() => fetchData(), delay)
            }
        }
    }, [token])

    // Schedule-based Precision Refresh
    useEffect(() => {
        if (!manifest?.next_check) return

        const targetTime = new Date(manifest.next_check).getTime()
        const now = Date.now()
        // Add 2s buffer to ensure server-side time has crossed the threshold
        const delay = (targetTime - now) + 2000

        if (delay > 0 && delay < 86400000) { // Sanity: max 24h
            const timer = setTimeout(() => fetchData(), delay)
            return () => clearTimeout(timer)
        }
    }, [manifest?.next_check, fetchData])

    // Signed URL refresh — re-fetch manifest before URLs expire
    useEffect(() => {
        if (!manifest?.fetched_at) return

        const fetchedAt = new Date(manifest.fetched_at).getTime()
        const expiresAt = fetchedAt + URL_REFRESH_MS
        const delay = expiresAt - Date.now()

        if (delay > 0) {
            const timer = setTimeout(() => fetchData(), delay)
            return () => clearTimeout(timer)
        } else {
            // Already expired, refresh now
            fetchData()
        }
    }, [manifest?.fetched_at, fetchData])

    // Initial fetch + polling + heartbeat
    useEffect(() => {
        fetchData()

        // Poll for refresh using REFS to avoid stale closure
        const pollTimer = setInterval(async () => {
            const current = manifestRef.current
            if (!current) return
            try {
                const res = await fetch(
                    `/api/player/refresh?token=${token}&knownVersion=${current.refresh_version}&knownMediaId=${current.media.id || ''}`
                )
                if (res.status === 429) return // Rate limited, skip
                if (res.ok) {
                    const data = await res.json()
                    if (data.should_refresh) {
                        fetchData()
                    }
                }
            } catch (e) {
                // Network error — silently continue, next poll will retry
            }
        }, POLL_INTERVAL_MS)

        // Heartbeat
        const heartbeatTimer = setInterval(() => {
            fetch(`/api/player/ping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    display_type: 'unknown'
                })
            }).catch(() => {})
        }, HEARTBEAT_INTERVAL_MS)

        return () => {
            clearInterval(pollTimer)
            clearInterval(heartbeatTimer)
        }
    }, [token, fetchData])

    // Media error handler — retry fetch on 403/corrupt media
    const handleMediaError = useCallback(() => {
        setMediaError(true)
        // Signed URL likely expired or file corrupt — re-fetch manifest for new URL
        setTimeout(() => fetchData(), 2000)
    }, [fetchData])

    // Fullscreen Logic
    useEffect(() => {
        const attemptFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen()
                }
            } catch (e) {
                // Auto-fullscreen blocked, waiting for interaction
            }
        }
        if (manifest) attemptFullscreen()
    }, [manifest])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
        } else {
            document.exitFullscreen().catch(() => {})
        }
    }

    // Wake Lock for TV Devices
    useEffect(() => {
        let wakeLock: any = null
        const requestWakeLock = async () => {
            if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                try {
                    wakeLock = await (navigator as any).wakeLock.request('screen')
                } catch { /* Wake Lock not available */ }
            }
        }

        if (isPlaying) {
            requestWakeLock()
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isPlaying) requestWakeLock()
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            if (wakeLock) wakeLock.release()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [isPlaying])

    // Auto-hide cursor after 3s of inactivity during playback
    useEffect(() => {
        if (!isPlaying) return

        let hideTimer: ReturnType<typeof setTimeout>

        const showCursor = () => {
            setCursorHidden(false)
            clearTimeout(hideTimer)
            hideTimer = setTimeout(() => setCursorHidden(true), 3000)
        }

        // Hide immediately after starting
        hideTimer = setTimeout(() => setCursorHidden(true), 3000)

        window.addEventListener('mousemove', showCursor)
        window.addEventListener('touchstart', showCursor)
        window.addEventListener('pointermove', showCursor)

        return () => {
            clearTimeout(hideTimer)
            window.removeEventListener('mousemove', showCursor)
            window.removeEventListener('touchstart', showCursor)
            window.removeEventListener('pointermove', showCursor)
        }
    }, [isPlaying])

    const handleStart = () => {
        setIsPlaying(true)
        toggleFullscreen()
    }

    if (!manifest && !error) return (
        <div className="bg-black text-white h-screen flex items-center justify-center">
            Loading Onesign...
        </div>
    )

    if (!isPlaying) {
        return (
            <div
                className="bg-black h-screen w-screen flex flex-col items-center justify-center text-white cursor-pointer z-50"
                onClick={handleStart}
            >
                <div className="w-24 h-24 mb-6 rounded-full border-4 border-white flex items-center justify-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-widest uppercase mb-2">Onesign Display</h1>
                <p className="text-gray-400 text-sm">Tap screen to initialize display</p>
            </div>
        )
    }

    return (
        <div
            onClick={toggleFullscreen}
            className="bg-black h-screen w-screen overflow-hidden flex items-center justify-center relative"
            style={{ cursor: cursorHidden ? 'none' : 'pointer' }}
        >
            <NeverSleepGuard active={isPlaying} />

            {manifest?.media?.url && !mediaError ? (
                manifest.media.type?.startsWith('video/') ? (
                    <video
                        key={manifest.media.url}
                        src={manifest.media.url}
                        className="w-full h-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        loop
                        onError={handleMediaError}
                    />
                ) : (
                    <img
                        key={manifest.media.url}
                        src={manifest.media.url}
                        className="w-full h-full object-contain"
                        alt="Digital Signage content"
                        onError={handleMediaError}
                    />
                )
            ) : (
                <div className="text-gray-500 font-mono">
                    <h1 className="text-2xl mb-2">Onesign Player</h1>
                    <p className="opacity-50 text-sm">No Content Assigned</p>
                    <p className="opacity-30 text-xs mt-4">{token}</p>
                </div>
            )}

            {/* Offline Indicator */}
            {error && (
                <div className="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-50">
                    Offline
                </div>
            )}
        </div>
    )
}
