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
}

export default function PlayerPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    // Refs to avoid stale closures in intervals/timeouts
    const manifestRef = useRef<Manifest | null>(null)
    const refreshVersionRef = useRef<number>(-1)

    // Keep refs in sync with state
    useEffect(() => {
        manifestRef.current = manifest
        if (manifest) refreshVersionRef.current = manifest.refresh_version
    }, [manifest])

    // Polling Config
    const POLL_INTERVAL_MS = 30000 // 30s for schedule transitions
    const HEARTBEAT_INTERVAL_MS = 60000

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`/api/player/manifest?token=${token}`)
            if (!res.ok) throw new Error('Failed to fetch manifest')
            const data = await res.json()
            setManifest(data)
            localStorage.setItem(`onesign_manifest_${token}`, JSON.stringify(data))
        } catch (err) {
            console.error(err)
            setError('Offline')
            const cached = localStorage.getItem(`onesign_manifest_${token}`)
            if (cached) {
                setManifest(JSON.parse(cached))
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
            console.log(`[Player] Precision refresh scheduled for ${manifest.next_check} (in ${Math.round(delay / 1000)}s)`)
            const timer = setTimeout(() => {
                console.log('[Player] Precision refresh triggered')
                fetchData()
            }, delay)

            return () => clearTimeout(timer)
        }
    }, [manifest?.next_check, fetchData])

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
                if (res.ok) {
                    const data = await res.json()
                    if (data.should_refresh) {
                        console.log('[Player] Poll detected change, refreshing...')
                        fetchData()
                    }
                }
            } catch (e) {
                console.warn('[Player] Poll failed', e)
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
            }).catch(console.warn)
        }, HEARTBEAT_INTERVAL_MS)

        return () => {
            clearInterval(pollTimer)
            clearInterval(heartbeatTimer)
        }
    }, [token, fetchData])


    // Fullscreen Logic
    useEffect(() => {
        const attemptFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen()
                }
            } catch (e) {
                console.log('Auto-fullscreen blocked, waiting for interaction')
            }
        }
        // Attempt on mount (often blocked) and when manifest loads
        if (manifest) attemptFullscreen()
    }, [manifest])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error)
        } else {
            document.exitFullscreen().catch(console.error)
        }
    }

    // Wake Lock for TV Devices
    useEffect(() => {
        let wakeLock: any = null
        const requestWakeLock = async () => {
            if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                try {
                    wakeLock = await (navigator as any).wakeLock.request('screen')
                    console.log('Wake Lock active')
                } catch (err: any) {
                    console.warn('Wake Lock failed:', err.message)
                }
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

    const handleStart = () => {
        setIsPlaying(true)
        toggleFullscreen()
    }

    if (!manifest && !error) return (
        // Initial loading state - wait for manifest before even showing "Start" if we want
        // But showing "Start" early is fine too. Let's stick to simple loading first.
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
            className="bg-black h-screen w-screen overflow-hidden flex items-center justify-center relative cursor-pointer"
        >
            <NeverSleepGuard active={isPlaying} />

            {manifest?.media?.url ? (
                manifest.media.type?.startsWith('video/') ? (
                    <video
                        src={manifest.media.url}
                        className="w-full h-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        loop
                    />
                ) : (
                    <img
                        src={manifest.media.url}
                        className="w-full h-full object-contain"
                        alt="Digital Signage content"
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
