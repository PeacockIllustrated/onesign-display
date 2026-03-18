'use client'

import { useEffect, useState, useRef, useCallback, use } from 'react'
import { NeverSleepGuard } from '@/components/player/never-sleep-guard'

type PlaylistItem = {
    id: string
    url: string | null
    type: string
    duration_seconds: number | null
}

type PlaylistData = {
    id: string
    transition: 'fade' | 'cut' | 'slide_left' | 'slide_right'
    transition_duration_ms: number
    loop: boolean
    items: PlaylistItem[]
}

type Manifest = {
    screen_id: string
    refresh_version: number
    media: {
        id: string | null
        url: string | null
        type: string | null
    }
    playlist: PlaylistData | null
    next_check: string | null
    fetched_at: string
}

const URL_REFRESH_MS = 45 * 60 * 1000

export default function PlayerPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [mediaError, setMediaError] = useState(false)
    const [cursorHidden, setCursorHidden] = useState(false)

    // Slideshow state — dual-layer for smooth transitions
    const [slideIndex, setSlideIndex] = useState(0)
    const [prevSlideIndex, setPrevSlideIndex] = useState<number | null>(null)
    const [transitionPhase, setTransitionPhase] = useState<'idle' | 'out' | 'in'>('idle')
    const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [preloaded, setPreloaded] = useState(false)

    const manifestRef = useRef<Manifest | null>(null)
    const retryCountRef = useRef(0)

    useEffect(() => { manifestRef.current = manifest }, [manifest])

    const POLL_INTERVAL_MS = 30000
    const HEARTBEAT_INTERVAL_MS = 60000
    const MAX_RETRY_DELAY_MS = 120000

    // Reset slide index when playlist changes
    useEffect(() => {
        setSlideIndex(0)
        setPrevSlideIndex(null)
        setTransitionPhase('idle')
        setPreloaded(false)
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current)
    }, [manifest?.playlist?.id])

    // Preload all playlist media on mount / playlist change
    useEffect(() => {
        const playlist = manifest?.playlist
        if (!playlist || playlist.items.length === 0) return

        let loaded = 0
        const total = playlist.items.length

        playlist.items.forEach(item => {
            if (!item.url) { loaded++; return }

            if (item.type?.startsWith('video/')) {
                const vid = document.createElement('video')
                vid.preload = 'auto'
                vid.src = item.url
                vid.oncanplaythrough = () => { loaded++; if (loaded >= total) setPreloaded(true) }
                vid.onerror = () => { loaded++; if (loaded >= total) setPreloaded(true) }
            } else {
                const img = new Image()
                img.src = item.url
                img.onload = () => { loaded++; if (loaded >= total) setPreloaded(true) }
                img.onerror = () => { loaded++; if (loaded >= total) setPreloaded(true) }
            }
        })

        // Fallback: mark preloaded after 5s even if some fail
        const fallback = setTimeout(() => setPreloaded(true), 5000)
        return () => clearTimeout(fallback)
    }, [manifest?.playlist])

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`/api/player/manifest?token=${token}`)
            if (res.status === 429) return
            if (res.status >= 400 && res.status < 500) {
                if (!manifestRef.current) setError('Invalid token')
                return
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            setManifest(data)
            setError(null)
            setMediaError(false)
            retryCountRef.current = 0
            localStorage.setItem(`onesign_manifest_${token}`, JSON.stringify(data))
        } catch (err) {
            retryCountRef.current++
            if (!manifestRef.current) {
                setError('Offline')
                const cached = localStorage.getItem(`onesign_manifest_${token}`)
                if (cached) { try { setManifest(JSON.parse(cached)) } catch { } }
            }
            if (!manifestRef.current) {
                const delay = Math.min((2 ** retryCountRef.current) * 1000, MAX_RETRY_DELAY_MS)
                setTimeout(() => fetchData(), delay)
            }
        }
    }, [token])

    // Schedule precision refresh
    useEffect(() => {
        if (!manifest?.next_check) return
        const delay = (new Date(manifest.next_check).getTime() - Date.now()) + 2000
        if (delay > 0 && delay < 86400000) {
            const timer = setTimeout(() => fetchData(), delay)
            return () => clearTimeout(timer)
        }
    }, [manifest?.next_check, fetchData])

    // Signed URL refresh
    useEffect(() => {
        if (!manifest?.fetched_at) return
        const delay = new Date(manifest.fetched_at).getTime() + URL_REFRESH_MS - Date.now()
        if (delay > 0) {
            const timer = setTimeout(() => fetchData(), delay)
            return () => clearTimeout(timer)
        } else { fetchData() }
    }, [manifest?.fetched_at, fetchData])

    // Polling + heartbeat
    useEffect(() => {
        fetchData()
        const pollTimer = setInterval(async () => {
            const current = manifestRef.current
            if (!current) return
            try {
                const playlistId = current.playlist?.id || ''
                const res = await fetch(
                    `/api/player/refresh?token=${token}&knownVersion=${current.refresh_version}&knownMediaId=${current.media.id || ''}&knownPlaylistId=${playlistId}`
                )
                if (res.status === 429) return
                if (res.ok) {
                    const data = await res.json()
                    if (data.should_refresh) fetchData()
                }
            } catch { }
        }, POLL_INTERVAL_MS)

        const heartbeatTimer = setInterval(() => {
            fetch('/api/player/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, viewport: `${window.innerWidth}x${window.innerHeight}`, display_type: 'unknown' })
            }).catch(() => {})
        }, HEARTBEAT_INTERVAL_MS)

        return () => { clearInterval(pollTimer); clearInterval(heartbeatTimer) }
    }, [token, fetchData])

    // ── Slideshow: advance with symmetric transition ─────────

    const advanceSlide = useCallback(() => {
        const playlist = manifestRef.current?.playlist
        if (!playlist || playlist.items.length === 0 || transitionPhase !== 'idle') return

        const dur = playlist.transition_duration_ms

        if (playlist.transition === 'cut') {
            // Instant swap, no animation
            setSlideIndex(prev => {
                const next = prev + 1
                return next >= playlist.items.length ? (playlist.loop ? 0 : prev) : next
            })
            return
        }

        // Phase 1: Transition OUT current slide
        setTransitionPhase('out')

        setTimeout(() => {
            // Phase 2: Swap slide (hidden), then transition IN
            setPrevSlideIndex(slideIndex)
            setSlideIndex(prev => {
                const next = prev + 1
                return next >= playlist.items.length ? (playlist.loop ? 0 : prev) : next
            })
            setTransitionPhase('in')

            setTimeout(() => {
                // Phase 3: Done
                setTransitionPhase('idle')
                setPrevSlideIndex(null)
            }, dur)
        }, dur)
    }, [slideIndex, transitionPhase])

    // Slideshow: timer for image slides
    useEffect(() => {
        const playlist = manifest?.playlist
        if (!playlist || playlist.items.length === 0 || !isPlaying || !preloaded) return

        const currentItem = playlist.items[slideIndex]
        if (!currentItem) return

        const isVideo = currentItem.type?.startsWith('video/')

        if (!isVideo && currentItem.duration_seconds) {
            slideTimerRef.current = setTimeout(() => advanceSlide(), currentItem.duration_seconds * 1000)
            return () => { if (slideTimerRef.current) clearTimeout(slideTimerRef.current) }
        }
    }, [slideIndex, manifest?.playlist, isPlaying, advanceSlide, preloaded])

    const handleVideoEnded = useCallback(() => advanceSlide(), [advanceSlide])

    const handleMediaError = useCallback(() => {
        setMediaError(true)
        setTimeout(() => fetchData(), 2000)
    }, [fetchData])

    // Fullscreen
    useEffect(() => {
        if (manifest) { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen() } catch { } }
    }, [manifest])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
        else document.exitFullscreen().catch(() => {})
    }

    // Wake Lock
    useEffect(() => {
        let wakeLock: any = null
        const requestWakeLock = async () => {
            if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                try { wakeLock = await (navigator as any).wakeLock.request('screen') } catch { }
            }
        }
        if (isPlaying) requestWakeLock()
        const handleVisibility = () => { if (document.visibilityState === 'visible' && isPlaying) requestWakeLock() }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => { if (wakeLock) wakeLock.release(); document.removeEventListener('visibilitychange', handleVisibility) }
    }, [isPlaying])

    // Cursor hide
    useEffect(() => {
        if (!isPlaying) return
        let hideTimer: ReturnType<typeof setTimeout>
        const showCursor = () => { setCursorHidden(false); clearTimeout(hideTimer); hideTimer = setTimeout(() => setCursorHidden(true), 3000) }
        hideTimer = setTimeout(() => setCursorHidden(true), 3000)
        window.addEventListener('mousemove', showCursor)
        window.addEventListener('touchstart', showCursor)
        window.addEventListener('pointermove', showCursor)
        return () => { clearTimeout(hideTimer); window.removeEventListener('mousemove', showCursor); window.removeEventListener('touchstart', showCursor); window.removeEventListener('pointermove', showCursor) }
    }, [isPlaying])

    const handleStart = () => { setIsPlaying(true); toggleFullscreen() }

    // ── Loading / Start screens ──────────────────────────────

    if (!manifest && !error) return (
        <div className="bg-black text-white h-screen flex items-center justify-center">Loading Onesign...</div>
    )

    if (!isPlaying) return (
        <div className="bg-black h-screen w-screen flex flex-col items-center justify-center text-white cursor-pointer z-50" onClick={handleStart}>
            <div className="w-24 h-24 mb-6 rounded-full border-4 border-white flex items-center justify-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase mb-2">Onesign Display</h1>
            <p className="text-gray-400 text-sm">Tap screen to initialize display</p>
        </div>
    )

    // ── Transition helpers ────────────────────────────────────

    const playlist = manifest?.playlist

    function getSlideStyle(isVisible: boolean): React.CSSProperties {
        if (!playlist) return {}
        const dur = `${playlist.transition_duration_ms}ms`

        switch (playlist.transition) {
            case 'fade':
                return { transition: `opacity ${dur} ease`, opacity: isVisible ? 1 : 0 }
            case 'slide_left':
                return { transition: `transform ${dur} ease`, transform: isVisible ? 'translateX(0)' : 'translateX(-100%)' }
            case 'slide_right':
                return { transition: `transform ${dur} ease`, transform: isVisible ? 'translateX(0)' : 'translateX(100%)' }
            case 'cut':
            default:
                return { opacity: isVisible ? 1 : 0 }
        }
    }

    // ── Render slide helper ──────────────────────────────────

    function renderSlide(item: PlaylistItem, index: number, isVisible: boolean) {
        if (!item?.url) return null

        return (
            <div
                key={`slide-${index}`}
                className="absolute inset-0 flex items-center justify-center"
                style={{ ...getSlideStyle(isVisible), willChange: 'opacity, transform' }}
            >
                {item.type?.startsWith('video/') ? (
                    <video
                        src={item.url}
                        className="w-full h-full object-contain"
                        autoPlay={isVisible}
                        muted
                        playsInline
                        onEnded={isVisible ? handleVideoEnded : undefined}
                        onError={isVisible ? handleMediaError : undefined}
                    />
                ) : (
                    <img
                        src={item.url}
                        className="w-full h-full object-contain"
                        alt="Slide content"
                        onError={isVisible ? handleMediaError : undefined}
                    />
                )}
            </div>
        )
    }

    // ── Render: Playlist mode ────────────────────────────────

    if (playlist && playlist.items.length > 0) {
        const currentItem = playlist.items[slideIndex]
        const prevItem = prevSlideIndex !== null ? playlist.items[prevSlideIndex] : null

        // Determine visibility based on transition phase
        const currentVisible = transitionPhase !== 'out'
        const prevVisible = transitionPhase === 'out'

        return (
            <div
                onClick={toggleFullscreen}
                className="bg-black h-screen w-screen overflow-hidden relative"
                style={{ cursor: cursorHidden ? 'none' : 'pointer' }}
            >
                <NeverSleepGuard active={isPlaying} />

                {/* Previous slide (fading out) */}
                {prevItem && transitionPhase !== 'idle' && renderSlide(prevItem, prevSlideIndex!, prevVisible)}

                {/* Current slide */}
                {currentItem && renderSlide(currentItem, slideIndex, currentVisible)}

                {/* Loading indicator while preloading */}
                {!preloaded && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                        <div className="text-gray-500 text-sm">Loading slides...</div>
                    </div>
                )}

                {error && (
                    <div className="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-50">Offline</div>
                )}
            </div>
        )
    }

    // ── Render: Single media mode ────────────────────────────

    return (
        <div
            onClick={toggleFullscreen}
            className="bg-black h-screen w-screen overflow-hidden flex items-center justify-center relative"
            style={{ cursor: cursorHidden ? 'none' : 'pointer' }}
        >
            <NeverSleepGuard active={isPlaying} />

            {manifest?.media?.url && !mediaError ? (
                manifest.media.type?.startsWith('video/') ? (
                    <video key={manifest.media.url} src={manifest.media.url} className="w-full h-full object-contain" autoPlay muted playsInline loop onError={handleMediaError} />
                ) : (
                    <img key={manifest.media.url} src={manifest.media.url} className="w-full h-full object-contain" alt="Digital Signage content" onError={handleMediaError} />
                )
            ) : (
                <div className="text-gray-500 font-mono">
                    <h1 className="text-2xl mb-2">Onesign Player</h1>
                    <p className="opacity-50 text-sm">No Content Assigned</p>
                    <p className="opacity-30 text-xs mt-4">{token}</p>
                </div>
            )}

            {error && (
                <div className="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-50">Offline</div>
            )}
        </div>
    )
}
