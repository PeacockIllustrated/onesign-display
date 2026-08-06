'use client'

// The room. A placeholder venue wall (swappable for the client's reference
// photo via drag-in) with physically placed display hardware on it.
//
// Two interaction modes:
//  - Edit layout: mount/drag/resize/rotate/delete screens. Positions are
//    stored as wall fractions, so a layout survives a backdrop swap.
//  - Live: hovering a screen exposes its "physical" controls — power and
//    the Onesign USB player slot. Everything after that is software.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LocalDemoDriver } from '@/lib/demo/local-driver'
import type { VirtualClock } from '@/lib/demo/virtual-clock'
import type { DemoHardware, DemoState } from '@/lib/demo/types'
import { ScreenSurface } from './ScreenSurface'

type DragState =
    | { mode: 'move'; id: string; startX: number; startY: number; origX: number; origY: number }
    | { mode: 'resize'; id: string; startX: number; origW: number }

type LiveOverride = { id: string; x?: number; y?: number; w?: number }

export function Scene({
    driver,
    clock,
    state,
}: {
    driver: LocalDemoDriver
    clock: VirtualClock
    state: DemoState
}) {
    const wallRef = useRef<HTMLDivElement>(null)
    const [wallPx, setWallPx] = useState({ w: 1200, h: 500 })
    const [selected, setSelected] = useState<string | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const [live, setLive] = useState<LiveOverride | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    // Track wall pixel size so fraction coords become pixels.
    useEffect(() => {
        const el = wallRef.current
        if (!el) return
        const update = () => setWallPx({ w: el.clientWidth, h: el.clientHeight })
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── Drag / resize (local while moving; committed on release) ──

    const onPointerMove = useCallback((e: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return
        if (drag.mode === 'move') {
            const dx = (e.clientX - drag.startX) / wallPx.w
            const dy = (e.clientY - drag.startY) / wallPx.h
            setLive({
                id: drag.id,
                x: Math.min(0.96, Math.max(-0.02, drag.origX + dx)),
                y: Math.min(0.95, Math.max(-0.02, drag.origY + dy)),
            })
        } else {
            const dw = (e.clientX - drag.startX) / wallPx.w
            setLive({
                id: drag.id,
                w: Math.min(0.45, Math.max(0.05, drag.origW + dw)),
            })
        }
    }, [wallPx])

    const onPointerUp = useCallback(() => {
        const drag = dragRef.current
        dragRef.current = null
        setLive((cur) => {
            if (drag && cur && cur.id === drag.id) {
                driver.updateHardware(drag.id, {
                    ...(cur.x !== undefined ? { x: cur.x } : {}),
                    ...(cur.y !== undefined ? { y: cur.y } : {}),
                    ...(cur.w !== undefined ? { w: cur.w } : {}),
                })
            }
            return null
        })
    }, [driver])

    useEffect(() => {
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        return () => {
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [onPointerMove, onPointerUp])

    const startMove = (e: React.PointerEvent, hw: DemoHardware) => {
        if (!state.editMode) return
        e.preventDefault()
        setSelected(hw.id)
        dragRef.current = { mode: 'move', id: hw.id, startX: e.clientX, startY: e.clientY, origX: hw.x, origY: hw.y }
    }

    const startResize = (e: React.PointerEvent, hw: DemoHardware) => {
        e.preventDefault()
        e.stopPropagation()
        setSelected(hw.id)
        dragRef.current = { mode: 'resize', id: hw.id, startX: e.clientX, origW: hw.w }
    }

    // Delete key removes the selected screen in edit mode.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return
            if (state.editMode && selected && (e.key === 'Delete' || e.key === 'Backspace')) {
                driver.removeHardware(selected)
                setSelected(null)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [state.editMode, selected, driver])

    const loadBackdrop = (file: File) => {
        const reader = new FileReader()
        reader.onload = () => driver.setBackdrop(typeof reader.result === 'string' ? reader.result : null)
        reader.readAsDataURL(file)
    }

    const screens = Object.values(state.hardware)

    return (
        <div className="mx-auto w-full max-w-[1500px] px-6">
            {/* Edit toolbar */}
            {state.editMode && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                    <button
                        onClick={() => setSelected(driver.addHardware())}
                        className="rounded-md bg-white px-3 py-1.5 font-semibold text-neutral-950 hover:bg-neutral-200"
                    >
                        + Mount a screen
                    </button>
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500"
                    >
                        Load reference photo…
                    </button>
                    {state.backdropUrl && (
                        <button
                            onClick={() => driver.setBackdrop(null)}
                            className="rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-400 hover:border-neutral-500"
                        >
                            Clear photo
                        </button>
                    )}
                    <span className="ml-2 text-neutral-500">
                        Drag to position · corner handle resizes · Delete removes · positions are saved as fractions of the wall
                    </span>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) loadBackdrop(f)
                            e.target.value = ''
                        }}
                    />
                </div>
            )}

            {/* The room */}
            <div
                className="relative overflow-hidden rounded-xl border border-neutral-800 shadow-2xl"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f && f.type.startsWith('image/')) loadBackdrop(f)
                }}
            >
                {/* Wall */}
                <div
                    ref={wallRef}
                    className="relative w-full"
                    style={{
                        aspectRatio: '2.35 / 1',
                        background: state.backdropUrl
                            ? `url(${state.backdropUrl}) center / cover no-repeat`
                            : 'linear-gradient(180deg, #262320 0%, #211e1b 55%, #1b1917 100%)',
                    }}
                    onPointerDown={() => state.editMode && setSelected(null)}
                >
                    {!state.backdropUrl && (
                        <>
                            {/* Placeholder venue dressing — replaced wholesale by the reference photo */}
                            <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 65% at 38% 8%, rgba(255,214,150,0.10) 0%, transparent 60%)' }} />
                            <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 110%, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3.5%]" style={{ background: '#141210', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                        </>
                    )}

                    {screens.map((hw) => {
                        const o = live && live.id === hw.id ? { ...hw, ...live } : hw
                        return (
                            <PlacedScreen
                                key={hw.id}
                                hw={o}
                                wallPx={wallPx}
                                driver={driver}
                                clock={clock}
                                editMode={state.editMode}
                                selected={selected === hw.id}
                                onStartMove={startMove}
                                onStartResize={startResize}
                            />
                        )
                    })}

                    {screens.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-neutral-500">
                                <p className="text-lg font-medium text-neutral-400">An empty wall.</p>
                                <p className="mt-2 text-sm">
                                    Turn on <span className="text-neutral-300">Edit layout</span> and mount some screens —
                                    or use <span className="text-neutral-300">Quick start</span> for the preset 3+1 setup.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floor */}
                <div
                    className="h-16 w-full"
                    style={{ background: 'linear-gradient(180deg, #100e0d 0%, #0a0908 100%)' }}
                />
            </div>
        </div>
    )
}

// ── One physical display ──────────────────────────────────────

function PlacedScreen({
    hw,
    wallPx,
    driver,
    clock,
    editMode,
    selected,
    onStartMove,
    onStartResize,
}: {
    hw: DemoHardware
    wallPx: { w: number; h: number }
    driver: LocalDemoDriver
    clock: VirtualClock
    editMode: boolean
    selected: boolean
    onStartMove: (e: React.PointerEvent, hw: DemoHardware) => void
    onStartResize: (e: React.PointerEvent, hw: DemoHardware) => void
}) {
    const record = driver.recordForHardware(hw.id)
    const portrait = hw.orientation === 'portrait'

    const wPx = hw.w * wallPx.w
    const hPx = portrait ? wPx * (16 / 9) : wPx * (9 / 16)
    const xPx = hw.x * wallPx.w
    const yPx = hw.y * wallPx.h
    const bezel = Math.max(2, wPx * 0.014)

    return (
        <div
            className="absolute select-none"
            style={{ left: xPx, top: yPx, width: wPx, height: hPx, zIndex: selected ? 20 : 10 }}
            onPointerDown={(e) => {
                e.stopPropagation()
                onStartMove(e, hw)
            }}
        >
            {/* Panel + bezel */}
            <div
                className="group relative h-full w-full rounded-[4px] bg-black"
                style={{
                    padding: bezel,
                    cursor: editMode ? 'move' : 'default',
                    boxShadow: selected
                        ? '0 0 0 2px #4e7e8c, 0 18px 40px rgba(0,0,0,0.55)'
                        : '0 18px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.07)',
                }}
            >
                <div className="relative h-full w-full overflow-hidden bg-black">
                    <ScreenSurface
                        hw={hw}
                        record={record}
                        driver={driver}
                        clock={clock}
                        pxW={Math.max(1, wPx - bezel * 2)}
                        pxH={Math.max(1, hPx - bezel * 2)}
                    />
                </div>

                {/* Standby LED */}
                <span
                    className="absolute rounded-full"
                    style={{
                        right: bezel * 2.5,
                        bottom: Math.max(1, bezel * 0.28),
                        width: Math.max(2, wPx * 0.008),
                        height: Math.max(2, wPx * 0.008),
                        background: hw.powered ? '#34d399' : '#3f3f46',
                        boxShadow: hw.powered ? '0 0 6px rgba(52,211,153,0.9)' : 'none',
                    }}
                />

                {/* Hover hardware controls (live mode). The invisible bridge
                    keeps the group's hover area contiguous from panel to
                    buttons — without it, the pointer crosses a dead gap on
                    the way down and the controls vanish mid-travel. */}
                {!editMode && (
                    <div className="absolute inset-x-0 -bottom-10 h-10" aria-hidden />
                )}
                {!editMode && (
                    <div className="pointer-events-none absolute -bottom-9 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => driver.setPowered(hw.id, !hw.powered)}
                            className="whitespace-nowrap rounded-full bg-neutral-900/95 px-2.5 py-1 text-[10px] font-medium text-neutral-200 shadow-lg ring-1 ring-neutral-700 hover:bg-neutral-800"
                        >
                            ⏻ {hw.powered ? 'Power off' : 'Power on'}
                        </button>
                        {!hw.playerInserted && (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => driver.insertPlayer(hw.id)}
                                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg hover:brightness-110"
                                style={{ background: '#4e7e8c' }}
                            >
                                ▸ Insert Onesign USB
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Label + resize handle in edit mode */}
            {editMode && (
                <>
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-[10px] text-neutral-400">
                        <span className="rounded bg-neutral-900/90 px-1.5 py-0.5 ring-1 ring-neutral-700">
                            {record?.name ?? 'Unpaired display'} · {(hw.w * 100).toFixed(0)}%
                        </span>
                        {selected && (
                            <>
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() =>
                                        driver.updateHardware(hw.id, {
                                            orientation: portrait ? 'landscape' : 'portrait',
                                        })
                                    }
                                    className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300 ring-1 ring-neutral-600 hover:bg-neutral-700"
                                >
                                    ⟳ {portrait ? 'Landscape' : 'Portrait'}
                                </button>
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => driver.removeHardware(hw.id)}
                                    className="rounded bg-red-950 px-1.5 py-0.5 text-red-300 ring-1 ring-red-800 hover:bg-red-900"
                                >
                                    Remove
                                </button>
                            </>
                        )}
                    </div>
                    <div
                        onPointerDown={(e) => onStartResize(e, hw)}
                        className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-neutral-400 bg-neutral-800"
                        title="Resize"
                    />
                </>
            )}
        </div>
    )
}
