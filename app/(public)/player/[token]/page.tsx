'use client'

import { useEffect, useState, useRef, useCallback, useMemo, use } from 'react'
import { NeverSleepGuard } from '@/components/player/never-sleep-guard'
import { useSyncEngine } from '@/hooks/use-sync-engine'
import { SyncDebugOverlay } from '@/components/player/sync-debug-overlay'

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

type SyncConfig = {
    enabled: boolean
    epoch: string
    screen_index: number
    screen_count: number
}

type Manifest = {
    screen_id: string
    refresh_version: number
    media: {
        id: string | null
        url: string | null
        type: string | null
    }
    fit_mode: 'contain' | 'cover'
    playlist: PlaylistData | null
    sync: SyncConfig | null
    next_check: string | null
    fetched_at: string
}

const URL_REFRESH_MS = 45 * 60 * 1000

// ── VideoSlide: imperative play/pause via ref ────────────────
// Fixes BUG 1: autoPlay attribute has no effect on already-mounted elements.
// This component uses useEffect to call .play()/.pause() programmatically
// when visibility changes, which works reliably across all devices.

function VideoSlide({
    src,
    isVisible,
    fitClass,
    onEnded,
    onError,
    syncMode,
    syncSeekTime,
}: {
    src: string
    isVisible: boolean
    fitClass: string
    onEnded?: () => void
    onError?: () => void
    syncMode?: boolean
    syncSeekTime?: number
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (isVisible) {
            if (syncMode && syncSeekTime !== undefined) {
                // Sync mode: seek to computed position instead of 0
                video.currentTime = syncSeekTime
            } else {
                video.currentTime = 0
            }
            const playPromise = video.play()
            if (playPromise) {
                playPromise.catch((err) => {
                    console.warn('[Player] Video play() rejected:', err.name)
                    if (err.name === 'AbortError') {
                        setTimeout(() => { video.play().catch(() => {}) }, 100)
                    }
                })
            }
        } else {
            video.pause()
        }
    }, [isVisible, src, syncMode, syncSeekTime])

    // Sync mode: drift correction every 2s
    useEffect(() => {
        if (!syncMode || syncSeekTime === undefined || !isVisible) return

        const driftCheck = setInterval(() => {
            const video = videoRef.current
            if (!video || video.paused) return

            const drift = Math.abs(video.currentTime - syncSeekTime)
            if (drift > 0.1) { // 100ms threshold
                console.log(`[Sync] Video drift correction: ${(drift * 1000).toFixed(0)}ms`)
                video.currentTime = syncSeekTime
            }
        }, 2000)

        return () => clearInterval(driftCheck)
    }, [syncMode, syncSeekTime, isVisible])

    return (
        <video
            ref={videoRef}
            src={src}
            className={`w-full h-full ${fitClass}`}
            muted
            playsInline
            preload="auto"
            onEnded={syncMode ? undefined : onEnded}
            onError={onError}
        />
    )
}

// ── Main Player ──────────────────────────────────────────────

export default function PlayerPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [manifest, setManifest] = useState<Manifest | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [mediaError, setMediaError] = useState(false)
    const [cursorHidden, setCursorHidden] = useState(false)

    // Slideshow state — A/B layer crossfade (no unmount/remount)
    const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A')
    const [layerAIndex, setLayerAIndex] = useState(0)
    const [layerBIndex, setLayerBIndex] = useState(0)
    const [layerAVisible, setLayerAVisible] = useState(true)
    const [layerBVisible, setLayerBVisible] = useState(false)
    const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const transitioningRef = useRef(false)
    const [preloaded, setPreloaded] = useState(false)

    const manifestRef = useRef<Manifest | null>(null)
    const retryCountRef = useRef(0)

    useEffect(() => { manifestRef.current = manifest }, [manifest])

    const POLL_INTERVAL_MS = 30000
    const HEARTBEAT_INTERVAL_MS = 60000
    const MAX_RETRY_DELAY_MS = 120000

    // ── Clean playlist: filter out null-URL items (BUG 7 defense-in-depth) ──
    const cleanPlaylist = useMemo(() => {
        const pl = manifest?.playlist
        if (!pl) return null
        const validItems = pl.items.filter(item => item.url !== null)
        if (validItems.length === 0) return null
        return { ...pl, items: validItems }
    }, [manifest?.playlist])

    // Reset when playlist changes
    useEffect(() => {
        setActiveLayer('A')
        setLayerAIndex(0)
        setLayerBIndex(0)
        setLayerAVisible(true)
        setLayerBVisible(false)
        transitioningRef.current = false
        setPreloaded(false)
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current)
    }, [manifest?.playlist?.id])

    // ── Preload all playlist media (BUG 3+4 fix) ─────────────
    // Depends on playlist ID only — not the full object reference.
    // Tracks created elements and aborts them on cleanup.
    useEffect(() => {
        const playlist = cleanPlaylist
        if (!playlist || playlist.items.length === 0) return

        let cancelled = false
        let loaded = 0
        const total = playlist.items.length
        const elements: (HTMLVideoElement | HTMLImageElement)[] = []

        const checkDone = () => {
            if (!cancelled && loaded >= total) setPreloaded(true)
        }

        playlist.items.forEach(item => {
            if (!item.url) { loaded++; checkDone(); return }

            if (item.type?.startsWith('video/')) {
                const vid = document.createElement('video')
                vid.preload = 'auto'
                vid.src = item.url
                vid.oncanplaythrough = () => { loaded++; checkDone() }
                vid.onerror = () => { loaded++; checkDone() }
                elements.push(vid)
            } else {
                const img = new Image()
                img.src = item.url
                img.onload = () => { loaded++; checkDone() }
                img.onerror = () => { loaded++; checkDone() }
                elements.push(img)
            }
        })

        // Fallback: mark preloaded after 8s even if some fail
        const fallback = setTimeout(() => {
            if (!cancelled) setPreloaded(true)
        }, 8000)

        return () => {
            cancelled = true
            clearTimeout(fallback)
            // Abort all in-flight downloads
            elements.forEach(el => {
                if ('oncanplaythrough' in el) {
                    (el as HTMLVideoElement).oncanplaythrough = null
                }
                el.onload = null
                el.onerror = null
                if (el instanceof HTMLVideoElement) {
                    el.removeAttribute('src')
                    el.load() // Abort network fetch
                } else {
                    el.removeAttribute('src')
                }
            })
        }
    }, [manifest?.playlist?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

    // ── Signed URL refresh with retry (BUG 8 fix) ────────────
    // Separate from fetchData — retries independently on failure
    // so URLs don't all expire if one refresh attempt fails.
    useEffect(() => {
        if (!manifest?.fetched_at) return

        const delay = new Date(manifest.fetched_at).getTime() + URL_REFRESH_MS - Date.now()

        let retryTimer: ReturnType<typeof setTimeout> | null = null
        let attempts = 0
        const MAX_REFRESH_RETRIES = 3

        const attemptRefresh = async () => {
            attempts++
            try {
                const res = await fetch(`/api/player/manifest?token=${token}`)
                if (res.ok) {
                    const data = await res.json()
                    setManifest(data)
                    setError(null)
                    setMediaError(false)
                    localStorage.setItem(`onesign_manifest_${token}`, JSON.stringify(data))
                    return
                }
                throw new Error(`HTTP ${res.status}`)
            } catch (err) {
                console.warn(`[Player] URL refresh attempt ${attempts} failed:`, err)
                if (attempts < MAX_REFRESH_RETRIES) {
                    retryTimer = setTimeout(attemptRefresh, attempts * 30_000)
                }
            }
        }

        const timer = delay > 0
            ? setTimeout(attemptRefresh, delay)
            : setTimeout(attemptRefresh, 0)

        return () => {
            clearTimeout(timer)
            if (retryTimer) clearTimeout(retryTimer)
        }
    }, [manifest?.fetched_at, token])

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

    // ── Sync Engine ────────────────────────────────────────
    const syncEngine = useSyncEngine(
        manifest?.sync ?? null,
        cleanPlaylist,
        token,
    )
    const isSyncMode = syncEngine.position !== null && syncEngine.isCalibrated

    // Sync-driven layer management: when sync is active, override layers from computed position
    useEffect(() => {
        if (!isSyncMode || !syncEngine.position || !cleanPlaylist) return

        const pos = syncEngine.position

        if (pos.isInTransition) {
            // During transition: show current slide on one layer, next on the other
            setLayerAIndex(pos.slideIndex)
            setLayerBIndex(pos.nextSlideIndex)
            // Don't use boolean visibility — sync mode uses computed inline styles
            setLayerAVisible(true)
            setLayerBVisible(true)
        } else {
            // Display phase: show current slide on layer A, hide B
            setLayerAIndex(pos.slideIndex)
            setLayerAVisible(true)
            setLayerBVisible(false)
        }
    }, [isSyncMode, syncEngine.position?.slideIndex, syncEngine.position?.isInTransition, syncEngine.position?.nextSlideIndex, cleanPlaylist])

    // ── Slideshow: A/B layer crossfade (timer mode) ─────

    const currentSlideIndex = activeLayer === 'A' ? layerAIndex : layerBIndex

    const advanceSlide = useCallback(() => {
        const playlist = cleanPlaylist
        if (!playlist || playlist.items.length === 0 || transitioningRef.current) return

        const nextIndex = currentSlideIndex + 1 >= playlist.items.length
            ? (playlist.loop ? 0 : currentSlideIndex)
            : currentSlideIndex + 1

        if (nextIndex === currentSlideIndex) return // End of non-looping playlist

        const dur = playlist.transition_duration_ms
        transitioningRef.current = true

        if (playlist.transition === 'cut') {
            if (activeLayer === 'A') {
                setLayerBIndex(nextIndex)
                setLayerAVisible(false)
                setLayerBVisible(true)
                setActiveLayer('B')
            } else {
                setLayerAIndex(nextIndex)
                setLayerBVisible(false)
                setLayerAVisible(true)
                setActiveLayer('A')
            }
            transitioningRef.current = false
            return
        }

        // Load next slide into inactive layer, then crossfade
        if (activeLayer === 'A') {
            setLayerBIndex(nextIndex)
            requestAnimationFrame(() => {
                setLayerAVisible(false)
                setLayerBVisible(true)
                setTimeout(() => {
                    setActiveLayer('B')
                    transitioningRef.current = false
                }, dur)
            })
        } else {
            setLayerAIndex(nextIndex)
            requestAnimationFrame(() => {
                setLayerBVisible(false)
                setLayerAVisible(true)
                setTimeout(() => {
                    setActiveLayer('A')
                    transitioningRef.current = false
                }, dur)
            })
        }
    }, [currentSlideIndex, activeLayer, cleanPlaylist])

    // Slideshow: timer for image slides (SKIPPED in sync mode — sync engine drives advancement)
    useEffect(() => {
        if (isSyncMode) return // Sync engine controls slide advancement

        const playlist = cleanPlaylist
        if (!playlist || playlist.items.length === 0 || !isPlaying || !preloaded) return

        const currentItem = playlist.items[currentSlideIndex]
        if (!currentItem) return

        const isVideo = currentItem.type?.startsWith('video/')

        if (!isVideo && currentItem.duration_seconds) {
            slideTimerRef.current = setTimeout(() => advanceSlide(), currentItem.duration_seconds * 1000)
            return () => { if (slideTimerRef.current) clearTimeout(slideTimerRef.current) }
        }
    }, [currentSlideIndex, cleanPlaylist, isPlaying, advanceSlide, preloaded, isSyncMode])

    const handleVideoEnded = useCallback(() => advanceSlide(), [advanceSlide])

    const handleMediaError = useCallback(() => {
        setMediaError(true)
        setTimeout(() => fetchData(), 2000)
    }, [fetchData])

    // Fullscreen
    useEffect(() => {
        if (manifest && !document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}) }
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

    // ── Video health watchdog (BUG 5 fix) ────────────────────
    // Only runs when playlist or single media actually contains videos.
    // Resets lastProgress when currently showing an image slide.
    useEffect(() => {
        if (!isPlaying || !manifest) return

        const playlist = cleanPlaylist
        const hasVideos = playlist?.items.some(i => i.type?.startsWith('video/'))
        const singleIsVideo = !playlist && manifest.media?.type?.startsWith('video/')

        if (!hasVideos && !singleIsVideo) return

        const STUCK_THRESHOLD = 15_000
        let lastProgress = Date.now()
        let watchdogTimer: ReturnType<typeof setInterval>

        const markProgress = () => { lastProgress = Date.now() }
        const onStalled = () => { console.warn('[Player] Video stalled, will re-fetch if stuck') }

        // Attach listeners only to videos not yet instrumented
        const attachListeners = () => {
            const videos = document.querySelectorAll('video:not([data-guard]):not([data-watched])')
            videos.forEach(v => {
                v.setAttribute('data-watched', 'true')
                v.addEventListener('timeupdate', markProgress)
                v.addEventListener('loadeddata', markProgress)
                v.addEventListener('playing', markProgress)
                v.addEventListener('stalled', onStalled)
            })
        }

        let refetchPending = false
        watchdogTimer = setInterval(() => {
            const contentVideos = document.querySelectorAll('video:not([data-guard])')
            if (contentVideos.length === 0) {
                lastProgress = Date.now()
                return
            }

            const elapsed = Date.now() - lastProgress
            if (elapsed > STUCK_THRESHOLD && !refetchPending) {
                console.warn(`[Player] No video progress for ${Math.round(elapsed / 1000)}s — re-fetching manifest`)
                refetchPending = true
                fetchData().finally(() => {
                    setTimeout(() => { lastProgress = Date.now(); refetchPending = false }, 5000)
                })
            }
        }, 5000)

        attachListeners()
        const observer = new MutationObserver(() => attachListeners())
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            clearInterval(watchdogTimer)
            observer.disconnect()
            // Clean up all watched videos
            const allWatched = document.querySelectorAll('video[data-watched]')
            allWatched.forEach(v => {
                v.removeAttribute('data-watched')
                v.removeEventListener('timeupdate', markProgress)
                v.removeEventListener('loadeddata', markProgress)
                v.removeEventListener('playing', markProgress)
                v.removeEventListener('stalled', onStalled)
            })
        }
    }, [isPlaying, manifest, fetchData, cleanPlaylist])

    const handleStart = () => { setIsPlaying(true); toggleFullscreen() }

    // Content fit mode from manifest
    const fitClass = manifest?.fit_mode === 'cover' ? 'object-cover' : 'object-contain'

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

    // Timer mode: CSS transitions drive the animation
    function getSlideStyle(isVisible: boolean): React.CSSProperties {
        if (!cleanPlaylist) return {}
        const dur = `${cleanPlaylist.transition_duration_ms}ms`

        switch (cleanPlaylist.transition) {
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

    // Sync mode: computed inline styles at exact interpolation point (no CSS transitions)
    function getSyncSlideStyle(role: 'current' | 'next', transitionProgress: number): React.CSSProperties {
        if (!cleanPlaylist) return {}
        const isOutgoing = role === 'current'

        switch (cleanPlaylist.transition) {
            case 'fade':
                return {
                    transition: 'none',
                    opacity: isOutgoing ? (1 - transitionProgress) : transitionProgress,
                }
            case 'slide_left':
                return {
                    transition: 'none',
                    transform: isOutgoing
                        ? `translateX(${-100 * transitionProgress}%)`
                        : `translateX(${100 * (1 - transitionProgress)}%)`,
                }
            case 'slide_right':
                return {
                    transition: 'none',
                    transform: isOutgoing
                        ? `translateX(${100 * transitionProgress}%)`
                        : `translateX(${-100 * (1 - transitionProgress)}%)`,
                }
            case 'cut':
            default:
                return {
                    transition: 'none',
                    opacity: isOutgoing ? 0 : 1,
                }
        }
    }

    // ── Render slide helper ──────────────────────────────────

    function renderSlide(
        item: PlaylistItem,
        layerKey: string,
        isVisible: boolean,
        syncStyle?: React.CSSProperties,
        isSyncVideoSlide?: boolean,
    ) {
        if (!item?.url) return null

        const style = syncStyle
            ? { ...syncStyle, willChange: 'opacity, transform' as const, zIndex: isVisible ? 2 : 1 }
            : { ...getSlideStyle(isVisible), willChange: 'opacity, transform' as const, zIndex: isVisible ? 2 : 1 }

        return (
            <div
                key={`layer-${layerKey}`}
                className="absolute inset-0 flex items-center justify-center"
                style={style}
            >
                {item.type?.startsWith('video/') ? (
                    <VideoSlide
                        key={`video-${layerKey}-${item.id}`}
                        src={item.url}
                        isVisible={isVisible}
                        fitClass={fitClass}
                        onEnded={isSyncVideoSlide ? undefined : handleVideoEnded}
                        onError={handleMediaError}
                        syncMode={isSyncVideoSlide}
                        syncSeekTime={isSyncVideoSlide ? syncEngine.getExpectedVideoTime() : undefined}
                    />
                ) : (
                    <img
                        key={`img-${layerKey}-${item.id}`}
                        src={item.url}
                        className={`w-full h-full ${fitClass}`}
                        alt="Slide content"
                        onError={isVisible ? handleMediaError : undefined}
                    />
                )}
            </div>
        )
    }

    // ── Render: Playlist mode ────────────────────────────────

    if (cleanPlaylist && cleanPlaylist.items.length > 0) {
        const layerAItem = cleanPlaylist.items[layerAIndex]
        const layerBItem = cleanPlaylist.items[layerBIndex]

        // Compute sync-aware styles for each layer
        const pos = syncEngine.position
        let layerASyncStyle: React.CSSProperties | undefined
        let layerBSyncStyle: React.CSSProperties | undefined

        if (isSyncMode && pos) {
            if (pos.isInTransition) {
                // Layer A = outgoing current, Layer B = incoming next
                layerASyncStyle = getSyncSlideStyle('current', pos.transitionProgress)
                layerBSyncStyle = getSyncSlideStyle('next', pos.transitionProgress)
            } else {
                // Only current slide visible
                layerASyncStyle = { transition: 'none', opacity: 1 }
                layerBSyncStyle = { transition: 'none', opacity: 0 }
            }
        }

        return (
            <div
                onClick={toggleFullscreen}
                className="bg-black h-screen w-screen overflow-hidden relative"
                style={{ cursor: cursorHidden ? 'none' : 'pointer' }}
            >
                <NeverSleepGuard active={isPlaying} />

                {/* Layer A */}
                {layerAItem && renderSlide(
                    layerAItem, 'A',
                    isSyncMode ? (pos?.isInTransition ? true : true) : layerAVisible,
                    layerASyncStyle,
                    isSyncMode,
                )}

                {/* Layer B */}
                {layerBItem && renderSlide(
                    layerBItem, 'B',
                    isSyncMode ? (pos?.isInTransition ?? false) : layerBVisible,
                    layerBSyncStyle,
                    isSyncMode,
                )}

                {/* Loading indicator while preloading */}
                {!preloaded && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                        <div className="text-gray-500 text-sm">Loading slides...</div>
                    </div>
                )}

                {/* Sync calibrating indicator */}
                {manifest?.sync?.enabled && !syncEngine.isCalibrated && preloaded && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                        <div className="text-gray-500 text-sm">Synchronizing...</div>
                    </div>
                )}

                {/* Debug overlay (toggle with Shift+D x3) */}
                <SyncDebugOverlay
                    syncEngine={syncEngine}
                    syncConfig={manifest?.sync ?? null}
                    playlist={cleanPlaylist}
                />

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
                    <video key={manifest.media.url} src={manifest.media.url} className={`w-full h-full ${fitClass}`} autoPlay muted playsInline loop onError={handleMediaError} />
                ) : (
                    <img key={manifest.media.url} src={manifest.media.url} className={`w-full h-full ${fitClass}`} alt="Digital Signage content" onError={handleMediaError} />
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
