'use client'

import { useEffect, useState, useRef, useCallback, useMemo, use } from 'react'
import { NeverSleepGuard } from '@/components/player/never-sleep-guard'
import { useSyncEngine } from '@/hooks/use-sync-engine'
import { SyncDebugOverlay } from '@/components/player/sync-debug-overlay'
import Hls from 'hls.js'

type StreamData = {
    id: string
    url: string
    type: 'hls' | 'dash' | 'embed'
    audio_enabled: boolean
    fallback_url: string | null
}

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
    stream: StreamData | null
    sync: SyncConfig | null
    next_check: string | null
    fetched_at: string
}

const URL_REFRESH_MS = 12 * 60 * 60 * 1000 // 12 hours — signed URLs now last 24hr, refresh twice daily

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
    onReady,
    syncMode,
    syncSeekTime,
}: {
    src: string
    isVisible: boolean
    fitClass: string
    onEnded?: () => void
    onError?: () => void
    onReady?: () => void
    syncMode?: boolean
    syncSeekTime?: number
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    // Track the sync seek time in a ref so the drift-correction interval
    // always reads the latest value without re-triggering the effect.
    const syncSeekRef = useRef(syncSeekTime)
    syncSeekRef.current = syncSeekTime

    // Track whether we've done the initial seek for this visibility cycle.
    // This prevents re-seeking on every syncSeekTime update from the engine.
    const hasInitialSeeked = useRef(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (isVisible) {
            if (syncMode && syncSeekRef.current !== undefined) {
                // Sync mode: seek once to computed position, then let video free-run
                video.currentTime = syncSeekRef.current
            } else {
                video.currentTime = 0
            }
            hasInitialSeeked.current = true

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
            hasInitialSeeked.current = false
        }
        // Only re-run when visibility or src changes — NOT on syncSeekTime updates.
        // The initial seek uses the ref value; after that, drift correction handles it.
    }, [isVisible, src, syncMode])

    // Sync mode: gentle drift correction via playbackRate nudging.
    // Checks every 5s. Never hard-seeks unless drift is catastrophic (>1s).
    // This eliminates the jitter caused by frequent seeking.
    useEffect(() => {
        if (!syncMode || !isVisible) return

        // Deadband thresholds (in seconds)
        const DRIFT_IGNORE   = 0.2   // <200ms: do nothing, imperceptible
        const DRIFT_NUDGE    = 1.0   // 200ms–1s: adjust playbackRate to catch up/slow down
        const DRIFT_HARD_SEEK = 1.0  // >1s: something went very wrong, hard seek

        // How much to speed up / slow down (2% is inaudible even with audio)
        const RATE_FAST = 1.02
        const RATE_SLOW = 0.98
        const RATE_NORMAL = 1.0

        let currentRate = RATE_NORMAL

        const driftCheck = setInterval(() => {
            const video = videoRef.current
            const expected = syncSeekRef.current
            if (!video || video.paused || expected === undefined) return

            const actual = video.currentTime
            const drift = actual - expected // positive = video is ahead, negative = behind

            const absDrift = Math.abs(drift)

            if (absDrift < DRIFT_IGNORE) {
                // Within deadband — restore normal rate if we were nudging
                if (currentRate !== RATE_NORMAL) {
                    video.playbackRate = RATE_NORMAL
                    currentRate = RATE_NORMAL
                }
            } else if (absDrift < DRIFT_HARD_SEEK) {
                // Nudge zone: gently adjust playback rate
                const targetRate = drift > 0 ? RATE_SLOW : RATE_FAST
                if (currentRate !== targetRate) {
                    video.playbackRate = targetRate
                    currentRate = targetRate
                    console.log(
                        `[Sync] Video drift ${drift > 0 ? '+' : ''}${(drift * 1000).toFixed(0)}ms — ` +
                        `nudging rate to ${targetRate}`
                    )
                }
            } else {
                // Catastrophic drift — hard seek as last resort
                console.warn(`[Sync] Video drift ${(drift * 1000).toFixed(0)}ms — hard seeking`)
                video.currentTime = expected
                video.playbackRate = RATE_NORMAL
                currentRate = RATE_NORMAL
            }
        }, 5000)

        return () => {
            clearInterval(driftCheck)
            // Restore normal rate on cleanup
            const video = videoRef.current
            if (video) video.playbackRate = 1.0
        }
    }, [syncMode, isVisible])

    return (
        <video
            ref={videoRef}
            src={src}
            className={`w-full h-full ${fitClass}`}
            muted
            playsInline
            preload="auto"
            onLoadedData={onReady}
            onEnded={syncMode ? undefined : onEnded}
            onError={onError}
        />
    )
}

// ── StreamSlide: HLS/DASH live stream playback ──────────────
// Uses hls.js for Chrome/Firefox, native HLS for Safari.
// Auto-reconnects on network errors, shows fallback on fatal failure.

function StreamSlide({
    url,
    type,
    audioEnabled,
    fallbackUrl,
    fitClass,
    onError,
}: {
    url: string
    type: 'hls' | 'dash' | 'embed'
    audioEnabled: boolean
    fallbackUrl: string | null
    fitClass: string
    onError?: () => void
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)
    const [showFallback, setShowFallback] = useState(false)
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const attemptReconnect = useCallback(() => {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        retryTimerRef.current = setTimeout(() => {
            setShowFallback(false)
            // Force re-attach by destroying and recreating
            if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
            }
            const video = videoRef.current
            if (!video) return

            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 30,
                })
                hlsRef.current = hls
                hls.loadSource(url)
                hls.attachMedia(video)
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {})
                })
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError()
                        } else {
                            setShowFallback(true)
                            attemptReconnect()
                        }
                    }
                })
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url
                video.play().catch(() => {})
            }
        }, 30_000) // Retry every 30 seconds
    }, [url])

    useEffect(() => {
        const video = videoRef.current
        if (!video || type === 'embed') return

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 30,
            })
            hlsRef.current = hls

            hls.loadSource(url)
            hls.attachMedia(video)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {})
            })

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn('[Stream] Media error — attempting recovery')
                            hls.recoverMediaError()
                            break
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn('[Stream] Network error — showing fallback, retrying in 30s')
                            setShowFallback(true)
                            attemptReconnect()
                            break
                        default:
                            console.error('[Stream] Fatal error — showing fallback, retrying in 30s')
                            hls.destroy()
                            setShowFallback(true)
                            attemptReconnect()
                            break
                    }
                }
            })

            return () => {
                hls.destroy()
                hlsRef.current = null
                if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
            }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari)
            video.src = url
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(() => {})
            })

            const handleError = () => {
                console.warn('[Stream] Native HLS error — showing fallback')
                setShowFallback(true)
                attemptReconnect()
            }
            video.addEventListener('error', handleError)

            return () => {
                video.removeEventListener('error', handleError)
                if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
            }
        } else {
            console.error('[Stream] HLS not supported on this browser')
            setShowFallback(true)
            onError?.()
        }
    }, [url, type, attemptReconnect, onError])

    if (type === 'embed') {
        return (
            <iframe
                src={url}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-scripts allow-same-origin"
            />
        )
    }

    return (
        <>
            <video
                ref={videoRef}
                className={`w-full h-full ${fitClass} ${showFallback ? 'hidden' : ''}`}
                muted={!audioEnabled}
                playsInline
                autoPlay
            />
            {showFallback && (
                fallbackUrl ? (
                    <img
                        src={fallbackUrl}
                        className={`w-full h-full ${fitClass}`}
                        alt="Stream offline — showing fallback"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 mb-4 rounded-full border-2 border-gray-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" />
                            </svg>
                        </div>
                        <p className="text-sm font-mono">Stream Offline</p>
                        <p className="text-xs text-gray-600 mt-1">Reconnecting...</p>
                    </div>
                )
            )}
        </>
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

    // Lookahead preload state: we only gate on the FIRST slide being ready.
    // Subsequent slides are pre-loaded into the hidden DOM layer with plenty
    // of lead time, so they're always decoded before the transition fires.
    const [firstSlideReady, setFirstSlideReady] = useState(false)
    const firstSlideReadyRef = useRef(false)
    const hiddenLayerReadyRef = useRef(false)
    const pendingAdvanceRef = useRef(false)
    const activeLayerRef = useRef<'A' | 'B'>('A')
    const advanceSlideRef = useRef<() => void>(() => {})

    const manifestRef = useRef<Manifest | null>(null)
    const retryCountRef = useRef(0)

    useEffect(() => { manifestRef.current = manifest }, [manifest])
    useEffect(() => { activeLayerRef.current = activeLayer }, [activeLayer])

    const POLL_INTERVAL_MS = 60000 // 60s — content changes detected via refresh_version, not poll speed
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

    // Derived: which slide index is currently active (whichever layer is on top)
    const currentSlideIndex = activeLayer === 'A' ? layerAIndex : layerBIndex

    // Reset when playlist changes
    useEffect(() => {
        setActiveLayer('A')
        activeLayerRef.current = 'A'
        setLayerAIndex(0)
        setLayerBIndex(0)
        setLayerAVisible(true)
        setLayerBVisible(false)
        transitioningRef.current = false
        setFirstSlideReady(false)
        firstSlideReadyRef.current = false
        hiddenLayerReadyRef.current = false
        pendingAdvanceRef.current = false
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current)
    }, [manifest?.playlist?.id])

    // ── Lookahead preload: load next slide into hidden DOM layer ──
    // Instead of downloading ALL slides into throwaway elements (which get
    // garbage-collected and evicted from GPU memory on low-RAM devices),
    // we pre-load only the NEXT slide directly into the hidden A/B layer.
    //
    // The hidden layer sits at opacity 0.01 — invisible but GPU-composited.
    // Its content stays decoded in video memory, guaranteeing zero black
    // flash when the crossfade starts. Each slide gets the full display
    // duration of the previous slide (5-30+ seconds) to download and decode.
    //
    // Only the FIRST slide needs a loading gate. This is much faster than
    // waiting for an entire playlist to download before showing anything.

    // Skip lookahead when sync engine controls layers
    const syncEnabled = manifest?.sync?.enabled ?? false

    useEffect(() => {
        if (syncEnabled || !cleanPlaylist || cleanPlaylist.items.length <= 1) return
        if (transitioningRef.current) return

        const nextIndex = currentSlideIndex + 1 >= cleanPlaylist.items.length
            ? (cleanPlaylist.loop ? 0 : -1)
            : currentSlideIndex + 1

        if (nextIndex < 0 || nextIndex === currentSlideIndex) return

        // Check if hidden layer already has the correct content (common in short loops —
        // e.g. a 2-item playlist where the previous slide IS the next slide)
        const hiddenAlreadyCorrect = activeLayer === 'A'
            ? layerBIndex === nextIndex
            : layerAIndex === nextIndex

        if (hiddenAlreadyCorrect) {
            hiddenLayerReadyRef.current = true
            return
        }

        // Pre-set hidden layer to the next slide — it starts loading immediately
        hiddenLayerReadyRef.current = false
        pendingAdvanceRef.current = false

        if (activeLayer === 'A') {
            setLayerBIndex(nextIndex)
        } else {
            setLayerAIndex(nextIndex)
        }

        // Safety timeout: if content never loads (broken URL, network failure),
        // force-mark ready after 10s so the slideshow doesn't get stuck.
        const safetyTimer = setTimeout(() => {
            if (!hiddenLayerReadyRef.current) {
                console.warn('[Player] Hidden layer load timeout — proceeding anyway')
                hiddenLayerReadyRef.current = true
                if (pendingAdvanceRef.current) {
                    pendingAdvanceRef.current = false
                    advanceSlideRef.current()
                }
            }
        }, 10_000)

        return () => clearTimeout(safetyTimer)
    }, [currentSlideIndex, activeLayer, cleanPlaylist, syncEnabled, layerAIndex, layerBIndex])

    // Called when a layer's img fires onLoad or video fires onLoadedData.
    // Uses refs exclusively so the callback identity is stable ([] deps).
    const handleLayerContentReady = useCallback((layer: 'A' | 'B') => {
        // First-slide gate — only fires once per playlist
        if (!firstSlideReadyRef.current) {
            firstSlideReadyRef.current = true
            setFirstSlideReady(true)
        }

        // If this is the hidden layer (lookahead target), mark it ready
        if (layer !== activeLayerRef.current) {
            hiddenLayerReadyRef.current = true
            if (pendingAdvanceRef.current) {
                pendingAdvanceRef.current = false
                // Defer to microtask — avoid calling advanceSlide inside an event handler
                Promise.resolve().then(() => {
                    if (!transitioningRef.current) {
                        advanceSlideRef.current()
                    }
                })
            }
        }
    }, [])

    // Stable per-layer callbacks (avoids inline arrow in render)
    const onLayerAReady = useCallback(() => handleLayerContentReady('A'), [handleLayerContentReady])
    const onLayerBReady = useCallback(() => handleLayerContentReady('B'), [handleLayerContentReady])

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

    const advanceSlide = useCallback(() => {
        const playlist = cleanPlaylist
        if (!playlist || playlist.items.length <= 1 || transitioningRef.current) return

        // Hidden layer content must be ready before we crossfade.
        // If it's still loading (slow network), defer — handleLayerContentReady
        // will call us back via advanceSlideRef as soon as onLoad fires.
        if (!hiddenLayerReadyRef.current) {
            pendingAdvanceRef.current = true
            return
        }

        const dur = playlist.transition_duration_ms
        transitioningRef.current = true
        pendingAdvanceRef.current = false

        if (playlist.transition === 'cut') {
            if (activeLayer === 'A') {
                setLayerAVisible(false)
                setLayerBVisible(true)
                setActiveLayer('B')
            } else {
                setLayerBVisible(false)
                setLayerAVisible(true)
                setActiveLayer('A')
            }
            transitioningRef.current = false
            return
        }

        // Content is pre-decoded in the hidden layer — crossfade directly.
        // No double-rAF needed: the hidden layer has been sitting at opacity 0.01
        // with content fully decoded in GPU memory for the entire display duration.
        if (activeLayer === 'A') {
            setLayerAVisible(false)
            setLayerBVisible(true)
            setTimeout(() => {
                setActiveLayer('B')
                transitioningRef.current = false
            }, dur)
        } else {
            setLayerBVisible(false)
            setLayerAVisible(true)
            setTimeout(() => {
                setActiveLayer('A')
                transitioningRef.current = false
            }, dur)
        }
    }, [activeLayer, cleanPlaylist])

    // Keep ref in sync so the stable handleLayerContentReady callback
    // always invokes the latest version of advanceSlide.
    useEffect(() => { advanceSlideRef.current = advanceSlide }, [advanceSlide])

    // Slideshow: timer for image slides (SKIPPED in sync mode — sync engine drives advancement)
    useEffect(() => {
        if (isSyncMode) return // Sync engine controls slide advancement

        const playlist = cleanPlaylist
        if (!playlist || playlist.items.length === 0 || !isPlaying || !firstSlideReady) return

        const currentItem = playlist.items[currentSlideIndex]
        if (!currentItem) return

        const isVideo = currentItem.type?.startsWith('video/')

        if (!isVideo && currentItem.duration_seconds) {
            slideTimerRef.current = setTimeout(() => advanceSlide(), currentItem.duration_seconds * 1000)
            return () => { if (slideTimerRef.current) clearTimeout(slideTimerRef.current) }
        }
    }, [currentSlideIndex, cleanPlaylist, isPlaying, advanceSlide, firstSlideReady, isSyncMode])

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

    // Timer mode: CSS transitions drive the animation.
    // IMPORTANT: Hidden layers use opacity 0.01 (not 0) to prevent mobile
    // browsers from de-compositing them. At 0.01 the layer is visually
    // invisible but the GPU keeps it in memory, so it's ready to paint
    // instantly when the transition starts. Using 0 causes a black flash
    // because the browser has to re-composite from scratch.
    function getSlideStyle(isVisible: boolean): React.CSSProperties {
        if (!cleanPlaylist) return {}
        const dur = `${cleanPlaylist.transition_duration_ms}ms`

        switch (cleanPlaylist.transition) {
            case 'fade':
                return { transition: `opacity ${dur} ease`, opacity: isVisible ? 1 : 0.01 }
            case 'slide_left':
                return { transition: `transform ${dur} ease`, transform: isVisible ? 'translateX(0)' : 'translateX(-100%)' }
            case 'slide_right':
                return { transition: `transform ${dur} ease`, transform: isVisible ? 'translateX(0)' : 'translateX(100%)' }
            case 'cut':
            default:
                return { opacity: isVisible ? 1 : 0.01 }
        }
    }

    // Sync mode: computed inline styles at exact interpolation point (no CSS transitions).
    // Uses Math.max(value, 0.01) on opacity to keep mobile GPU layers composited.
    function getSyncSlideStyle(role: 'current' | 'next', transitionProgress: number): React.CSSProperties {
        if (!cleanPlaylist) return {}
        const isOutgoing = role === 'current'

        switch (cleanPlaylist.transition) {
            case 'fade':
                return {
                    transition: 'none',
                    opacity: Math.max(isOutgoing ? (1 - transitionProgress) : transitionProgress, 0.01),
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
                    opacity: isOutgoing ? 0.01 : 1,
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
        onContentReady?: () => void,
    ) {
        if (!item?.url) return null

        const baseStyle = syncStyle ?? getSlideStyle(isVisible)
        const style: React.CSSProperties = {
            ...baseStyle,
            willChange: 'opacity, transform',
            // Force GPU layer promotion on mobile — prevents de-compositing
            // that causes black flashes when layers become visible
            backfaceVisibility: 'hidden' as const,
            // ANDROID FIX: The OUTGOING (active) layer must be on top during
            // crossfade. Android Chrome may not have composited the incoming
            // layer's GPU texture yet — keeping the outgoing on top means its
            // full-opacity content covers any blank frames underneath.
            // activeLayer hasn't changed yet during a transition (it updates
            // in the setTimeout after the CSS transition completes), so this
            // naturally puts the outgoing layer on z-index 2.
            zIndex: layerKey === activeLayer ? 2 : 1,
        }

        // Wrap onContentReady with double-rAF to wait for GPU paint commit.
        // Android Chrome fires onLoad when the bitmap is decoded, but the GPU
        // texture upload is async. Without this, we'd mark "ready" before the
        // texture is actually paintable, causing a blank frame during crossfade.
        const onGpuReady = onContentReady ? () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    onContentReady()
                })
            })
        } : undefined

        // CRITICAL: Use STABLE keys (layer-A, layer-B) — NOT keys that
        // include item.id. Changing keys forces React to unmount the old
        // <img>/<video> and mount a new one. The new element has no loaded
        // content for 1-3 frames → black flash on mobile. Stable keys keep
        // the DOM element alive; only the `src` attribute updates, so the
        // browser shows the old content until the new source paints.
        return (
            <div
                key={`layer-${layerKey}`}
                className="absolute inset-0 flex items-center justify-center"
                style={style}
            >
                {item.type?.startsWith('video/') ? (
                    <VideoSlide
                        key={`video-${layerKey}`}
                        src={item.url}
                        isVisible={isVisible}
                        fitClass={fitClass}
                        onEnded={isSyncVideoSlide ? undefined : handleVideoEnded}
                        onError={handleMediaError}
                        onReady={onGpuReady}
                        syncMode={isSyncVideoSlide}
                        syncSeekTime={isSyncVideoSlide ? syncEngine.getExpectedVideoTime() : undefined}
                    />
                ) : (
                    <img
                        key={`img-${layerKey}`}
                        src={item.url}
                        className={`w-full h-full ${fitClass}`}
                        alt="Slide content"
                        onLoad={onGpuReady}
                        onError={isVisible ? handleMediaError : undefined}
                    />
                )}
            </div>
        )
    }

    // ── Render: Stream mode ──────────────────────────────────

    if (manifest?.stream?.url) {
        return (
            <div
                onClick={toggleFullscreen}
                className="bg-black h-screen w-screen overflow-hidden flex items-center justify-center relative"
                style={{ cursor: cursorHidden ? 'none' : 'pointer' }}
            >
                <NeverSleepGuard active={isPlaying} />
                <StreamSlide
                    url={manifest.stream.url}
                    type={manifest.stream.type}
                    audioEnabled={manifest.stream.audio_enabled}
                    fallbackUrl={manifest.stream.fallback_url}
                    fitClass={fitClass}
                    onError={handleMediaError}
                />
                {error && (
                    <div className="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-50">Offline</div>
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
                // Only current slide visible; keep inactive at 0.01 to stay composited
                layerASyncStyle = { transition: 'none', opacity: 1 }
                layerBSyncStyle = { transition: 'none', opacity: 0.01 }
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
                    onLayerAReady,
                )}

                {/* Layer B */}
                {layerBItem && renderSlide(
                    layerBItem, 'B',
                    isSyncMode ? (pos?.isInTransition ?? false) : layerBVisible,
                    layerBSyncStyle,
                    isSyncMode,
                    onLayerBReady,
                )}

                {/* Loading overlay — fades out over 300ms instead of instant unmount.
                    Instant removal can flash black on Android because the GPU hasn't
                    finished compositing the first slide's texture underneath. */}
                <div
                    className="absolute inset-0 bg-black flex items-center justify-center z-10 transition-opacity duration-300"
                    style={{
                        opacity: firstSlideReady ? 0 : 1,
                        pointerEvents: firstSlideReady ? 'none' : 'auto',
                    }}
                >
                    {!firstSlideReady && (
                        <div className="text-gray-500 text-sm">Loading slides...</div>
                    )}
                </div>

                {/* Sync calibrating indicator */}
                {manifest?.sync?.enabled && !syncEngine.isCalibrated && firstSlideReady && (
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
