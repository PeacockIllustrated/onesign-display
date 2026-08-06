'use client'

// The simulated TV. One component walks the whole hardware journey:
//
//   unpowered → NO SIGNAL → (insert Onesign USB) → boot splash →
//   pairing code → live player
//
// The live player deliberately mirrors app/(public)/player/[token]/page.tsx:
// manifest fetch with cached last-known-good + exponential backoff, instant
// auto-resume when a paired stick reboots, HtmlSlide-style scaled iframe for
// menus, and playlist position computed by the REAL computeSyncPosition()
// from lib/sync/compute-position — driven by the demo's virtual clock.

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeSyncPosition } from '@/lib/sync/compute-position'
import type { LocalDemoDriver } from '@/lib/demo/local-driver'
import type { VirtualClock } from '@/lib/demo/virtual-clock'
import type { DemoHardware, DemoManifest, DemoScreenRecord } from '@/lib/demo/types'

type Props = {
    hw: DemoHardware
    record: DemoScreenRecord | null
    driver: LocalDemoDriver
    clock: VirtualClock
    pxW: number
    pxH: number
}

// ── Full-screen TV "canvases" ─────────────────────────────────
// System screens (boot, pairing, idle…) are designed at TV resolution and
// scaled to the placed size, so typography holds up at any screen size.

function TvCanvas({
    pxW,
    pxH,
    portrait,
    children,
}: {
    pxW: number
    pxH: number
    portrait: boolean
    children: React.ReactNode
}) {
    const cw = portrait ? 1080 : 1920
    const ch = portrait ? 1920 : 1080
    const scale = Math.min(pxW / cw, pxH / ch)
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
            <div style={{ width: cw, height: ch, transform: `scale(${scale})`, flexShrink: 0 }}>
                {children}
            </div>
        </div>
    )
}

function BootSplash() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            <div className="text-[64px] font-bold tracking-[0.08em] text-white">
                <span style={{ color: '#4e7e8c' }}>Onesign</span> Display
            </div>
            <div className="mt-10 h-[3px] w-[360px] overflow-hidden rounded bg-neutral-800">
                <div className="h-full w-1/3 animate-[demo-boot_1.6s_ease-in-out_infinite] rounded" style={{ background: '#4e7e8c' }} />
            </div>
            <style>{`@keyframes demo-boot { 0% { transform: translateX(-120%) } 100% { transform: translateX(420%) } }`}</style>
        </div>
    )
}

function PairingScreen({ code }: { code: string }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-center">
            <div className="text-[52px] font-bold tracking-[0.06em] text-white">
                <span style={{ color: '#4e7e8c' }}>Onesign</span> Display
            </div>
            <p className="mt-4 text-[30px] text-neutral-400">Ready to pair</p>
            <div
                className="mt-14 rounded-2xl border-2 px-20 py-10 text-[110px] font-bold tracking-[0.18em] text-white"
                style={{ borderColor: '#4e7e8c', background: 'rgba(78,126,140,0.08)' }}
            >
                {code}
            </div>
            <p className="mt-14 max-w-[1100px] text-[28px] leading-relaxed text-neutral-500">
                Open the Onesign app on your phone → Screens → Pair a screen,
                and enter this code
            </p>
        </div>
    )
}

function NoSignal() {
    return (
        <div className="w-full h-full bg-black relative">
            <div className="absolute left-[60px] top-[52px] rounded bg-neutral-900 px-8 py-4 text-[34px] font-medium tracking-widest text-neutral-400">
                NO SIGNAL · HDMI 1
            </div>
        </div>
    )
}

function IdleReady({ name }: { name: string }) {
    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center text-center"
            style={{ background: 'linear-gradient(135deg, #13241D 0%, #0E1914 100%)' }}
        >
            <div className="text-[46px] font-semibold tracking-[0.22em]" style={{ color: '#C7A06A' }}>
                {name.toUpperCase()}
            </div>
            <div className="mt-8 flex items-center gap-4 text-[26px] text-neutral-400">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                Connected — waiting for content
            </div>
        </div>
    )
}

// ── Menu rendering (HtmlSlide equivalent) ─────────────────────

function MenuSlide({ html, pxW, pxH }: { html: string; pxW: number; pxH: number }) {
    const scale = Math.min(pxW / 1920, pxH / 1080)
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
            <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, flexShrink: 0 }}>
                <iframe
                    srcDoc={html}
                    sandbox="allow-same-origin"
                    tabIndex={-1}
                    className="pointer-events-none block border-0 outline-none"
                    style={{ width: 1920, height: 1080 }}
                    title="HTML menu"
                />
            </div>
        </div>
    )
}

// ── Playlist rendering (real sync math) ───────────────────────

function PlaylistPlayer({
    manifest,
    clock,
}: {
    manifest: DemoManifest
    clock: VirtualClock
}) {
    const playlist = manifest.playlist!
    // Synced screens share the set epoch; unsynced ones start their cycle
    // when the content mounts (matching the real player's sequential mode).
    const localEpochRef = useRef<number>(clock.now())
    const [frame, setFrame] = useState({ a: 0, b: 0, opacity: 0 })
    const frameRef = useRef(frame)
    frameRef.current = frame

    useEffect(() => {
        localEpochRef.current = clock.now()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlist.id])

    useEffect(() => {
        let running = true
        let timer: ReturnType<typeof setTimeout> | null = null

        const epochMs = manifest.sync
            ? new Date(manifest.sync.epoch).getTime()
            : localEpochRef.current

        const step = () => {
            if (!running) return
            const pos = computeSyncPosition(
                clock.now(),
                epochMs,
                playlist.items,
                playlist.transition_duration_ms,
                playlist.loop,
                playlist.transition,
            )
            const next = {
                a: pos.slideIndex,
                b: pos.nextSlideIndex,
                opacity: pos.isInTransition ? Math.round(pos.transitionProgress * 100) / 100 : 0,
            }
            const cur = frameRef.current
            if (next.a !== cur.a || next.b !== cur.b || next.opacity !== cur.opacity) {
                setFrame(next)
            }
            timer = setTimeout(step, pos.isInTransition ? 16 : 120)
        }
        step()

        return () => {
            running = false
            if (timer) clearTimeout(timer)
        }
    }, [playlist, manifest.sync, clock])

    const a = playlist.items[frame.a]
    const b = playlist.items[frame.b]

    return (
        <div className="absolute inset-0 overflow-hidden bg-black">
            {a && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {b && frame.opacity > 0 && b.id !== a?.id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={b.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ opacity: frame.opacity }}
                />
            )}
        </div>
    )
}

// ── The TV itself ─────────────────────────────────────────────

const BOOT_MS = 1800

export function ScreenSurface({ hw, record, driver, clock, pxW, pxH }: Props) {
    const portrait = hw.orientation === 'portrait'
    const active = hw.powered && hw.playerInserted

    // Boot animation runs on real hardware time whenever the stick+power
    // combination comes up.
    const [booted, setBooted] = useState(false)
    useEffect(() => {
        if (!active) {
            setBooted(false)
            return
        }
        const t = setTimeout(() => setBooted(true), BOOT_MS)
        return () => clearTimeout(t)
    }, [active])

    // ── Manifest lifecycle (mirrors the real player) ─────────
    const token = hw.storedToken
    const [manifest, setManifest] = useState<DemoManifest | null>(null)
    const [offline, setOffline] = useState(false)
    const [retryAt, setRetryAt] = useState<number | null>(null)
    const manifestRef = useRef<DemoManifest | null>(null)
    manifestRef.current = manifest
    const retryCountRef = useRef(0)
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchManifest = useCallback(async () => {
        if (!token) return
        try {
            const data = await driver.getManifest(token)
            retryCountRef.current = 0
            setManifest(data)
            setOffline(false)
            setRetryAt(null)
            // Persist last-known-good "onto the stick" (player localStorage).
            driver.updateHardware(hw.id, { cachedManifest: data })
        } catch {
            retryCountRef.current++
            setOffline(true)
            // Cold boot with no reachable platform: fall back to the stick's
            // cached manifest so content still comes up. Read live from the
            // driver — this callback outlives renders via the poll timer.
            const cached = driver.getState().hardware[hw.id]?.cachedManifest
            if (!manifestRef.current && cached) {
                setManifest(cached)
            }
            const delay = Math.min(2 ** retryCountRef.current * 1000, 15_000)
            setRetryAt(Date.now() + delay)
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
            retryTimerRef.current = setTimeout(fetchManifest, delay)
        }
    }, [driver, token, hw.id])

    // Boot → instant-on from stick cache, then fetch fresh. Poll as backstop.
    useEffect(() => {
        if (!active || !booted || !token) {
            setManifest(null)
            setOffline(false)
            retryCountRef.current = 0
            return
        }
        if (hw.cachedManifest) setManifest(hw.cachedManifest)
        fetchManifest()
        const poll = setInterval(fetchManifest, 20_000)
        return () => {
            clearInterval(poll)
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, booted, token])

    // Push: refetch when this screen's record is bumped (content assigned,
    // menu updated, sync toggled, set membership changed).
    const refreshVersion = record?.refreshVersion ?? 0
    useEffect(() => {
        if (active && booted && token && refreshVersion > 0) fetchManifest()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshVersion])

    // Venue wifi restored → retry immediately instead of waiting out backoff.
    const wifi = driver.getState().wifi
    useEffect(() => {
        if (wifi && offline && active && booted) {
            retryCountRef.current = 0
            fetchManifest()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wifi])

    // Pairing code when booted with no token.
    const [code, setCode] = useState<string | null>(null)
    useEffect(() => {
        if (active && booted && !token) {
            setCode(driver.ensurePairingCode(hw.id))
        } else {
            setCode(null)
        }
    }, [active, booted, token, driver, hw.id])

    // Offline retry countdown (1 Hz).
    const [, forceTick] = useState(0)
    useEffect(() => {
        if (!offline || retryAt === null) return
        const t = setInterval(() => forceTick((n) => n + 1), 1000)
        return () => clearInterval(t)
    }, [offline, retryAt])

    // ── Render ───────────────────────────────────────────────

    if (!hw.powered) {
        return <div className="absolute inset-0 bg-black" />
    }

    if (!hw.playerInserted) {
        return (
            <TvCanvas pxW={pxW} pxH={pxH} portrait={portrait}>
                <NoSignal />
            </TvCanvas>
        )
    }

    if (!booted) {
        return (
            <TvCanvas pxW={pxW} pxH={pxH} portrait={portrait}>
                <BootSplash />
            </TvCanvas>
        )
    }

    if (!token) {
        return (
            <TvCanvas pxW={pxW} pxH={pxH} portrait={portrait}>
                {code ? <PairingScreen code={code} /> : <BootSplash />}
            </TvCanvas>
        )
    }

    const retryIn = retryAt ? Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) : null

    return (
        <div className="absolute inset-0 bg-black">
            {manifest?.html_menu?.html ? (
                <MenuSlide html={manifest.html_menu.html} pxW={pxW} pxH={pxH} />
            ) : manifest?.playlist ? (
                <PlaylistPlayer manifest={manifest} clock={clock} />
            ) : manifest ? (
                <TvCanvas pxW={pxW} pxH={pxH} portrait={portrait}>
                    <IdleReady name={record?.name ?? 'Onesign screen'} />
                </TvCanvas>
            ) : offline ? (
                <TvCanvas pxW={pxW} pxH={pxH} portrait={portrait}>
                    <div className="flex h-full w-full flex-col items-center justify-center bg-black text-center">
                        <p className="text-[34px] text-neutral-400">Can&apos;t reach Onesign</p>
                        <p className="mt-4 text-[24px] text-neutral-600">
                            Retrying{retryIn !== null ? ` in ${retryIn}s` : '…'}
                        </p>
                    </div>
                </TvCanvas>
            ) : (
                <TvCanvas pxW={pxW} pxH={pxH} portrait={portrait}>
                    <BootSplash />
                </TvCanvas>
            )}

            {/* Offline badge: cached content keeps playing, and says so. */}
            {offline && manifest && (
                <div
                    className="absolute right-[3%] top-[4%] flex items-center gap-1.5 rounded-full bg-black/75 text-red-400"
                    style={{ fontSize: Math.max(8, pxW * 0.028), padding: `${pxW * 0.012}px ${pxW * 0.03}px` }}
                >
                    <span className="inline-block h-[0.55em] w-[0.55em] animate-pulse rounded-full bg-red-500" />
                    OFFLINE · cached{retryIn !== null && retryIn > 0 ? ` · retry ${retryIn}s` : ''}
                </div>
            )}
        </div>
    )
}
