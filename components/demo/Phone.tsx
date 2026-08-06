'use client'

// The control phone — a working miniature of the Onesign admin app, pinned
// over the scene. Same vocabulary as the real portal (Screens, sets, sync,
// pair, assign, menus); the point of the demo is that a nervous first-time
// user can run their screens from this without training.
//
// Note the phone is on mobile data: cutting the VENUE wifi kills the TVs'
// connection but never this. Edits made during an outage land in the cloud
// and reach the screens when the venue reconnects.

import { useEffect, useRef, useState } from 'react'
import type { LocalDemoDriver } from '@/lib/demo/local-driver'
import type { VirtualClock } from '@/lib/demo/virtual-clock'
import type { ContentRef, DemoState } from '@/lib/demo/types'

type Tab = 'screens' | 'content' | 'activity'

export function Phone({
    driver,
    clock,
    state,
}: {
    driver: LocalDemoDriver
    clock: VirtualClock
    state: DemoState
}) {
    const [tab, setTab] = useState<Tab>('screens')
    const [collapsed, setCollapsed] = useState(false)
    const [pos, setPos] = useState({ x: -1, y: 84 }) // x<0 = anchored right
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

    // Virtual-clock time in the status bar.
    const [timeStr, setTimeStr] = useState('')
    useEffect(() => {
        const update = () =>
            setTimeStr(
                new Date(clock.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            )
        update()
        const t = setInterval(update, 500)
        return () => clearInterval(t)
    }, [clock])

    useEffect(() => {
        const move = (e: PointerEvent) => {
            const d = dragRef.current
            if (!d) return
            setPos({
                x: Math.max(8, d.origX + (e.clientX - d.startX)),
                y: Math.min(window.innerHeight - 120, Math.max(56, d.origY + (e.clientY - d.startY))),
            })
        }
        const up = () => (dragRef.current = null)
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        return () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
        }
    }, [])

    const style: React.CSSProperties =
        pos.x < 0 ? { right: 20, top: pos.y } : { left: pos.x, top: pos.y }

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                className="fixed z-50 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-2xl hover:brightness-110"
                style={{ ...style, background: '#4e7e8c' }}
            >
                📱 Open control phone
            </button>
        )
    }

    return (
        <div
            className="fixed z-50 flex h-[640px] w-[320px] flex-col overflow-hidden rounded-[36px] border-[6px] border-neutral-950 bg-neutral-100 shadow-2xl ring-1 ring-neutral-700"
            style={style}
        >
            {/* Status bar — doubles as the drag handle */}
            <div
                className="flex cursor-grab items-center justify-between bg-neutral-950 px-5 pb-2 pt-2.5 text-[11px] font-medium text-white active:cursor-grabbing"
                onPointerDown={(e) => {
                    const anchoredX = pos.x < 0 ? window.innerWidth - 20 - 320 : pos.x
                    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: anchoredX, origY: pos.y }
                }}
            >
                <span>{timeStr}</span>
                <span className="absolute left-1/2 top-1.5 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
                <span className="flex items-center gap-1.5">
                    5G <span className="text-neutral-500">·</span> ▮▮▮
                    <button
                        onClick={() => setCollapsed(true)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="ml-1 rounded px-1 text-neutral-400 hover:text-white"
                        title="Minimise phone"
                    >
                        —
                    </button>
                </span>
            </div>

            {/* App header */}
            <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#4e7e8c' }} />
                <span className="text-sm font-bold text-neutral-950">Onesign Display</span>
                <span className="ml-auto text-[10px] text-neutral-400">Demo Venue</span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-neutral-100">
                {tab === 'screens' && <ScreensTab driver={driver} state={state} />}
                {tab === 'content' && <ContentTab driver={driver} state={state} />}
                {tab === 'activity' && <ActivityTab state={state} />}
            </div>

            {/* Bottom nav */}
            <div className="grid grid-cols-3 border-t border-neutral-200 bg-white text-[11px] font-medium">
                {(
                    [
                        ['screens', 'Screens'],
                        ['content', 'Content'],
                        ['activity', 'Activity'],
                    ] as [Tab, string][]
                ).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`py-3 ${tab === key ? 'font-bold text-neutral-950' : 'text-neutral-400'}`}
                        style={tab === key ? { color: '#4e7e8c' } : undefined}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ── Screens tab ───────────────────────────────────────────────

function ScreensTab({ driver, state }: { driver: LocalDemoDriver; state: DemoState }) {
    const [pairOpen, setPairOpen] = useState(false)
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [setId, setSetId] = useState<string>('set-wall')
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<string | null>(null)

    const records = Object.values(state.records)
    const unpairedShowingCode = Object.values(state.hardware).filter(
        (h) => h.pairingCode && !h.storedToken && h.powered && h.playerInserted,
    ).length

    const doPair = () => {
        const res = driver.pairByCode(code, { name: name.trim() || 'New screen', setId: setId || null })
        if (!res.ok) {
            setError(res.error ?? 'Pairing failed')
            return
        }
        setCode('')
        setName('')
        setError(null)
        setPairOpen(false)
    }

    return (
        <div className="space-y-3 p-3">
            {/* Pair a screen */}
            <div className="rounded-xl bg-white p-3 shadow-sm">
                <button
                    onClick={() => setPairOpen(!pairOpen)}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-neutral-950"
                >
                    <span>+ Pair a screen</span>
                    {unpairedShowingCode > 0 && !pairOpen && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: '#4e7e8c' }}>
                            {unpairedShowingCode} waiting
                        </span>
                    )}
                </button>
                {pairOpen && (
                    <div className="mt-3 space-y-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Code shown on the TV"
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.2em] text-neutral-950 outline-none focus:border-neutral-500"
                        />
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Screen name (e.g. Menu Wall — Left)"
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500"
                        />
                        <select
                            value={setId}
                            onChange={(e) => setSetId(e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none"
                        >
                            {Object.values(state.sets).map((s) => (
                                <option key={s.id} value={s.id}>Set: {s.name}</option>
                            ))}
                            <option value="">No set</option>
                        </select>
                        {error && <p className="text-xs text-red-600">{error}</p>}
                        <button
                            onClick={doPair}
                            disabled={!code.trim()}
                            className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40"
                            style={{ background: '#4e7e8c' }}
                        >
                            Pair
                        </button>
                    </div>
                )}
            </div>

            {/* Sets + screens */}
            {[...Object.values(state.sets), null].map((set) => {
                const members = records.filter((r) => (set ? r.setId === set.id : r.setId === null))
                if (members.length === 0) return null
                return (
                    <div key={set?.id ?? 'none'} className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                                {set?.name ?? 'No set'} · {members.length}
                            </span>
                            {set && members.length > 1 && (
                                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-neutral-600">
                                    Sync
                                    <button
                                        onClick={() => driver.setSyncEnabled(set.id, !set.syncEnabled)}
                                        className={`h-4 w-8 rounded-full transition-colors ${set.syncEnabled ? '' : 'bg-neutral-300'}`}
                                        style={set.syncEnabled ? { background: '#4e7e8c' } : undefined}
                                        role="switch"
                                        aria-checked={set.syncEnabled}
                                    >
                                        <span
                                            className={`block h-3 w-3 rounded-full bg-white transition-transform ${set.syncEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                                        />
                                    </button>
                                </label>
                            )}
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {members.map((r) => {
                                const hw = state.hardware[r.hardwareId]
                                const ref = state.assignments[r.id] ?? { kind: 'none' as const }
                                const contentLabel =
                                    ref.kind === 'menu' ? state.menus[ref.id]?.name
                                    : ref.kind === 'playlist' ? state.playlists[ref.id]?.name
                                    : 'Nothing assigned'
                                const status = !hw?.powered || !hw?.playerInserted
                                    ? { dot: 'bg-neutral-400', label: 'Off' }
                                    : !state.wifi
                                    ? { dot: 'bg-red-500', label: 'Offline · cached' }
                                    : { dot: 'bg-emerald-500', label: 'Live' }
                                return (
                                    <div key={r.id} className="py-2">
                                        <button
                                            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                                            className="flex w-full items-center gap-2 text-left"
                                        >
                                            <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} title={status.label} />
                                            <span className="flex-1">
                                                <span className="block text-[13px] font-medium text-neutral-950">{r.name}</span>
                                                <span className="block text-[11px] text-neutral-400">{contentLabel}</span>
                                            </span>
                                            <span className="text-neutral-300">{expanded === r.id ? '▾' : '▸'}</span>
                                        </button>
                                        {expanded === r.id && (
                                            <ScreenDetail driver={driver} state={state} recordId={r.id} />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}

            {records.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-neutral-400">
                    No screens paired yet. Power a display on, insert the Onesign USB
                    player, and enter the code it shows.
                </p>
            )}
        </div>
    )
}

function ScreenDetail({
    driver,
    state,
    recordId,
}: {
    driver: LocalDemoDriver
    state: DemoState
    recordId: string
}) {
    const r = state.records[recordId]
    const current = state.assignments[recordId] ?? { kind: 'none' as const }

    const options: { ref: ContentRef; label: string; kind: string }[] = [
        ...Object.values(state.menus).map((m) => ({
            ref: { kind: 'menu' as const, id: m.id },
            label: m.name,
            kind: 'Menu',
        })),
        ...Object.values(state.playlists).map((p) => ({
            ref: { kind: 'playlist' as const, id: p.id },
            label: p.name,
            kind: 'Playlist',
        })),
        { ref: { kind: 'none' }, label: 'Nothing', kind: '' },
    ]

    const isCurrent = (ref: ContentRef) =>
        ref.kind === current.kind && (ref.kind === 'none' || ('id' in current && ref.id === current.id))

    return (
        <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Showing</p>
            <div className="space-y-1">
                {options.map((o) => (
                    <button
                        key={`${o.ref.kind}-${'id' in o.ref ? o.ref.id : 'none'}`}
                        onClick={() => driver.assignContent(recordId, o.ref)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${
                            isCurrent(o.ref)
                                ? 'font-semibold text-white'
                                : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100'
                        }`}
                        style={isCurrent(o.ref) ? { background: '#4e7e8c' } : undefined}
                    >
                        <span>{o.label}</span>
                        <span className={isCurrent(o.ref) ? 'text-white/70' : 'text-neutral-400'}>{o.kind}</span>
                    </button>
                ))}
            </div>
            <p className="pt-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Screen set</p>
            <select
                value={r.setId ?? ''}
                onChange={(e) => driver.moveToSet(recordId, e.target.value || null)}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-950 outline-none"
            >
                {Object.values(state.sets).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="">No set</option>
            </select>
        </div>
    )
}

// ── Content tab (menus + playlists, with live menu editing) ───

function ContentTab({ driver, state }: { driver: LocalDemoDriver; state: DemoState }) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)

    if (openMenuId) {
        const menu = state.menus[openMenuId]
        if (menu) {
            return <MenuEditor key={menu.id} driver={driver} state={state} menuId={menu.id} onBack={() => setOpenMenuId(null)} />
        }
    }

    const liveCount = (menuId: string) =>
        Object.values(state.assignments).filter((a) => a.kind === 'menu' && a.id === menuId).length

    return (
        <div className="space-y-3 p-3">
            <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Menus</p>
                <div className="divide-y divide-neutral-100">
                    {Object.values(state.menus).map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setOpenMenuId(m.id)}
                            className="flex w-full items-center gap-2 py-2.5 text-left"
                        >
                            <span className="flex-1">
                                <span className="block text-[13px] font-medium text-neutral-950">{m.name}</span>
                                <span className="block text-[11px] text-neutral-400">
                                    {m.renderError
                                        ? '⚠ last save failed — previous version live'
                                        : m.renderedHtml
                                        ? `Live on ${liveCount(m.id)} screen(s)`
                                        : 'Rendering…'}
                                </span>
                            </span>
                            <span className="text-neutral-300">▸</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Playlists</p>
                {Object.values(state.playlists).map((p) => (
                    <div key={p.id} className="py-1.5">
                        <span className="block text-[13px] font-medium text-neutral-950">{p.name}</span>
                        <span className="block text-[11px] text-neutral-400">
                            {p.items.length} slides · {p.transition} · loops
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Generic price/name editor over the two Uncle's theme content shapes.
// Walks the content JSON and exposes every item's name + price(s); the
// save round-trips through the REAL renderMenu() on the server.
function MenuEditor({
    driver,
    state,
    menuId,
    onBack,
}: {
    driver: LocalDemoDriver
    state: DemoState
    menuId: string
    onBack: () => void
}) {
    const menu = state.menus[menuId]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [draft, setDraft] = useState<any>(() => structuredClone(menu.contentJson))
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

    if (!draft) {
        return (
            <div className="p-4 text-xs text-neutral-400">
                <button onClick={onBack} className="mb-3 text-neutral-600">← Back</button>
                <p>Menu content is still rendering — try again in a second.</p>
            </div>
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutate = (fn: (d: any) => void) => {
        setDraft((prev: unknown) => {
            const next = structuredClone(prev)
            fn(next)
            return next
        })
        setResult(null)
    }

    const save = async () => {
        setSaving(true)
        const res = await driver.saveMenu(menuId, draft)
        setSaving(false)
        setResult(res)
    }

    const priceInput = (value: number, onChange: (v: number) => void) => (
        <input
            type="number"
            step="0.05"
            min="0"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-16 rounded-md border border-neutral-200 px-1.5 py-1 text-right text-xs text-neutral-950 outline-none focus:border-neutral-400"
        />
    )

    const isPanuozzi = menu.themeKey === 'uncles-panuozzi'

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2.5">
                <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-950">←</button>
                <span className="text-sm font-semibold text-neutral-950">{menu.name}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {isPanuozzi ? (
                    <>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                                {draft.section?.title ?? 'Items'} — classico / grande
                            </p>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {draft.section?.items?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 py-1.5">
                                    <input
                                        value={item.name}
                                        onChange={(e) => mutate((d) => { d.section.items[i].name = e.target.value })}
                                        className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-950 outline-none focus:border-neutral-400"
                                    />
                                    {priceInput(item.prices[0], (v) => mutate((d) => { d.section.items[i].prices[0] = v }))}
                                    {priceInput(item.prices[1], (v) => mutate((d) => { d.section.items[i].prices[1] = v }))}
                                </div>
                            ))}
                        </div>
                        {draft.feature && (
                            <div className="rounded-xl bg-white p-3 shadow-sm">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                                    {draft.feature.name}
                                </p>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {draft.feature.options?.map((opt: any, i: number) => (
                                    <div key={i} className="flex items-center gap-1.5 py-1.5">
                                        <input
                                            value={opt.name}
                                            onChange={(e) => mutate((d) => { d.feature.options[i].name = e.target.value })}
                                            className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-950 outline-none focus:border-neutral-400"
                                        />
                                        {priceInput(opt.price, (v) => mutate((d) => { d.feature.options[i].price = v }))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    draft.quadrants?.map((q: any, qi: number) => (
                        <div key={qi} className="rounded-xl bg-white p-3 shadow-sm">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{q.title}</p>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {q.items?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 py-1.5">
                                    <input
                                        value={item.name}
                                        onChange={(e) => mutate((d) => { d.quadrants[qi].items[i].name = e.target.value })}
                                        className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-950 outline-none focus:border-neutral-400"
                                    />
                                    {priceInput(item.price, (v) => mutate((d) => { d.quadrants[qi].items[i].price = v }))}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-neutral-200 bg-white p-3">
                {result && (
                    <p className={`mb-2 text-xs ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                        {result.ok
                            ? '✓ Saved — pushed to screens'
                            : `Save failed — screens keep the last good version. ${result.error ?? ''}`}
                    </p>
                )}
                <button
                    onClick={save}
                    disabled={saving}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: '#4e7e8c' }}
                >
                    {saving ? 'Rendering & publishing…' : 'Save & publish'}
                </button>
            </div>
        </div>
    )
}

// ── Activity tab ──────────────────────────────────────────────

const KIND_ICON: Record<string, string> = {
    pair: '🔗',
    content: '🖼',
    menu: '✏️',
    network: '📶',
    power: '⏻',
    sync: '⟲',
    scene: '🔧',
}

function ActivityTab({ state }: { state: DemoState }) {
    return (
        <div className="p-3">
            <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Activity</p>
                {state.log.length === 0 && (
                    <p className="py-4 text-center text-xs text-neutral-400">Nothing yet.</p>
                )}
                <div className="divide-y divide-neutral-100">
                    {state.log.map((entry, i) => (
                        <div key={i} className="flex gap-2 py-2">
                            <span className="text-xs">{KIND_ICON[entry.kind] ?? '•'}</span>
                            <span className="flex-1">
                                <span className="block text-[12px] leading-snug text-neutral-800">{entry.text}</span>
                                <span className="block text-[10px] text-neutral-400">
                                    {new Date(entry.at).toLocaleTimeString('en-GB')}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
