'use client'

// Top-level wiring for the in-situ demo simulator (/demo).
//
// Owns the singletons — the virtual clock and the LocalDemoDriver — and the
// presenter bar (the controls that are about running the DEMO, as opposed
// to the phone, which is the product being demonstrated).

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { VirtualClock } from '@/lib/demo/virtual-clock'
import { LocalDemoDriver } from '@/lib/demo/local-driver'
import type { MenuRenderFn } from '@/lib/demo/types'
import { Scene } from './Scene'
import { Phone } from './Phone'

const renderMenuFn: MenuRenderFn = async (themeKey, contentJson) => {
    const res = await fetch('/api/demo/render-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeKey, contentJson }),
    })
    if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        return { html: null, error: j.error ?? `HTTP ${res.status}`, content: contentJson }
    }
    return res.json()
}

const RATES = [1, 60, 600]

const emptySubscribe = () => () => {}

export default function DemoRoot() {
    const [env] = useState(() => {
        const clock = new VirtualClock()
        const driver = new LocalDemoDriver(clock, renderMenuFn)
        return { clock, driver }
    })
    const { clock, driver } = env

    // Persisted state can differ from the seed the server rendered with, so
    // mount-gate the whole app to sidestep hydration mismatches. (The
    // no-op-subscribe useSyncExternalStore is the standard hydration probe:
    // server snapshot false, client snapshot true.)
    const mounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    )
    useEffect(() => {
        void driver.ensureMenusRendered()
    }, [driver])

    const state = useSyncExternalStore(driver.subscribe, driver.getState, driver.getState)

    // Virtual-clock readout.
    const [clockStr, setClockStr] = useState('')
    const [rate, setRate] = useState(1)
    useEffect(() => {
        const update = () =>
            setClockStr(new Date(clock.now()).toLocaleTimeString('en-GB'))
        update()
        const t = setInterval(update, 250)
        const un = clock.subscribe(() => setRate(clock.rate))
        return () => {
            clearInterval(t)
            un()
        }
    }, [clock])

    // Presenter keyboard shortcuts.
    const onKey = useCallback(
        (e: KeyboardEvent) => {
            const t = e.target as HTMLElement
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return
            if (e.key === 'e' || e.key === 'E') driver.setEditMode(!driver.getState().editMode)
            if (e.key === 'w' || e.key === 'W') driver.setWifi(!driver.getState().wifi)
        },
        [driver],
    )
    useEffect(() => {
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onKey])

    if (!mounted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-950">
                <p className="text-sm text-neutral-500">Loading simulator…</p>
            </div>
        )
    }

    const hasScreens = Object.keys(state.records).length > 0

    return (
        <div className="min-h-screen bg-neutral-950 pb-24">
            {/* Presenter bar */}
            <div className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
                <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-white">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#4e7e8c' }} />
                        Onesign Display
                        <span className="font-normal text-neutral-500">· in-situ simulator</span>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {/* Virtual clock */}
                        <div className="flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800">
                            <span className="font-mono text-neutral-300">{clockStr}</span>
                            {RATES.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => clock.setRate(r)}
                                    className={`rounded-full px-1.5 py-0.5 ${
                                        rate === r ? 'font-bold text-white' : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                                    style={rate === r ? { background: '#4e7e8c' } : undefined}
                                    title={`Run time at ${r}×`}
                                >
                                    {r}×
                                </button>
                            ))}
                            <button
                                onClick={() => clock.reset()}
                                className="px-1 text-neutral-500 hover:text-neutral-300"
                                title="Reset to real time"
                            >
                                ↺
                            </button>
                        </div>

                        {/* Venue wifi */}
                        <button
                            onClick={() => driver.setWifi(!state.wifi)}
                            className={`rounded-full px-3 py-1 font-semibold ring-1 ${
                                state.wifi
                                    ? 'bg-emerald-950 text-emerald-300 ring-emerald-800'
                                    : 'bg-red-950 text-red-300 ring-red-800'
                            }`}
                            title="Toggle venue internet (W)"
                        >
                            {state.wifi ? 'Venue wi-fi: ONLINE' : 'Venue wi-fi: DOWN'}
                        </button>

                        {/* Edit layout */}
                        <button
                            onClick={() => driver.setEditMode(!state.editMode)}
                            className={`rounded-full px-3 py-1 font-semibold ring-1 ${
                                state.editMode
                                    ? 'text-white ring-transparent'
                                    : 'text-neutral-300 ring-neutral-700 hover:ring-neutral-500'
                            }`}
                            style={state.editMode ? { background: '#4e7e8c' } : undefined}
                            title="Toggle layout editing (E)"
                        >
                            {state.editMode ? 'Done editing' : 'Edit layout'}
                        </button>

                        {!hasScreens && (
                            <button
                                onClick={() => driver.quickStart()}
                                className="rounded-full bg-white px-3 py-1 font-semibold text-neutral-950 hover:bg-neutral-200"
                                title="Provision the preset 3+1 room instantly"
                            >
                                Quick start
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (window.confirm('Reset the demo to an empty room?')) driver.resetAll()
                            }}
                            className="rounded-full px-3 py-1 text-neutral-500 ring-1 ring-neutral-800 hover:text-neutral-300"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* The room */}
            <div className="pt-8">
                <Scene driver={driver} clock={clock} state={state} />
            </div>

            {/* Narration strip for the presenter */}
            <p className="mx-auto mt-4 max-w-[1500px] px-6 text-center text-[11px] text-neutral-600">
                Hover a screen for its hardware controls · phone floats on the right ·
                E = edit layout · W = cut venue wi-fi
            </p>

            <Phone driver={driver} clock={clock} state={state} />
        </div>
    )
}
