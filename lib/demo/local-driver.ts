// LocalDemoDriver — the demo's stand-in for the platform backend.
//
// It plays the role Supabase + /api/player/manifest play in production:
// screens "fetch manifests" from it, the phone "calls server actions" on it.
// The manifest-building logic deliberately mirrors the real route
// (app/api/player/manifest/route.ts): html_menu > playlist > media
// resolution, lazy sync-epoch init, refresh_version invalidation.
//
// Design notes for demo credibility:
// - Cutting venue wifi makes getManifest() fail for SCREENS, but every
//   phone-side mutation still works — the phone is on mobile data and the
//   platform is cloud-hosted. Edits made during an outage land when the
//   venue reconnects, exactly as they would in production.
// - saveMenu() keeps the last good render when a save fails to render,
//   matching the real fix in app/actions/menu-render-actions.ts.

import { computeSyncPosition } from '@/lib/sync/compute-position'
import type { VirtualClock } from './virtual-clock'
import type {
    ContentRef,
    DemoHardware,
    DemoLogEntry,
    DemoManifest,
    DemoScreenRecord,
    DemoState,
    MenuRenderFn,
} from './types'
import { makeSeedState, PRESET_LAYOUT } from './seed'

const STORAGE_KEY = 'onesign-demo-state-v1'
const NETWORK_LATENCY_MS = 450 // keeps propagation visibly real, not stage-magic
const MAX_LOG = 120

function uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function pairingCode(): string {
    // No 0/O/1/I — this gets read off a TV across a room.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const pick = (n: number) =>
        Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
    return `${pick(3)}-${pick(3)}`
}

export class LocalDemoDriver {
    private state: DemoState
    private listeners = new Set<() => void>()
    private persistTimer: ReturnType<typeof setTimeout> | null = null

    constructor(
        private clock: VirtualClock,
        private renderMenuFn: MenuRenderFn,
        private persist: boolean = true,
    ) {
        this.state = this.load() ?? makeSeedState()
    }

    // ── Store plumbing ───────────────────────────────────────

    getState = (): DemoState => this.state

    subscribe = (fn: () => void): (() => void) => {
        this.listeners.add(fn)
        return () => this.listeners.delete(fn)
    }

    private commit(mutate: (draft: DemoState) => void, log?: Omit<DemoLogEntry, 'at'>) {
        const next: DemoState = structuredClone(this.state)
        mutate(next)
        if (log) {
            next.log = [{ at: this.clock.nowIso(), ...log }, ...next.log].slice(0, MAX_LOG)
        }
        this.state = next
        this.listeners.forEach((fn) => fn())
        this.schedulePersist()
    }

    private load(): DemoState | null {
        if (!this.persist || typeof window === 'undefined') return null
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY)
            if (!raw) return null
            const parsed = JSON.parse(raw) as DemoState
            return parsed.version === 1 ? parsed : null
        } catch {
            return null
        }
    }

    private schedulePersist() {
        if (!this.persist || typeof window === 'undefined') return
        if (this.persistTimer) clearTimeout(this.persistTimer)
        this.persistTimer = setTimeout(() => {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
            } catch {
                // Oversized backdrop image etc. — demo keeps running unpersisted.
            }
        }, 300)
    }

    resetAll() {
        if (this.persist && typeof window !== 'undefined') {
            try { window.localStorage.removeItem(STORAGE_KEY) } catch { }
        }
        this.state = makeSeedState()
        this.listeners.forEach((fn) => fn())
        void this.ensureMenusRendered()
    }

    // ── Menu rendering (real pipeline) ───────────────────────

    /** Hydrate any menu that has never been rendered, using the theme's
     *  real defaultContent via the render endpoint. */
    async ensureMenusRendered() {
        for (const menu of Object.values(this.state.menus)) {
            if (menu.renderedHtml || menu.renderError) continue
            try {
                const res = await this.renderMenuFn(menu.themeKey, menu.contentJson)
                this.commit((d) => {
                    const m = d.menus[menu.id]
                    if (!m) return
                    if (res.html) {
                        m.contentJson = res.content
                        m.renderedHtml = res.html
                        m.renderedAt = this.clock.nowIso()
                        m.renderError = null
                    } else {
                        m.renderError = res.error
                    }
                })
            } catch {
                // Render endpoint unreachable — leave unrendered; screens
                // assigned to it will sit in their "waiting" state.
            }
        }
    }

    /** Save + re-render a menu. Mirrors saveAndRenderMenu(): a failed
     *  render must never clobber the last good HTML on the screens. */
    async saveMenu(menuId: string, contentJson: unknown): Promise<{ ok: boolean; error: string | null }> {
        const menu = this.state.menus[menuId]
        if (!menu) return { ok: false, error: 'Menu not found' }

        let res: Awaited<ReturnType<MenuRenderFn>>
        try {
            res = await this.renderMenuFn(menu.themeKey, contentJson)
        } catch {
            return { ok: false, error: 'Render service unreachable' }
        }

        if (!res.html) {
            this.commit(
                (d) => { d.menus[menuId].renderError = res.error },
                { kind: 'menu', text: `Save failed for “${menu.name}” — last good version stays live` },
            )
            return { ok: false, error: res.error }
        }

        this.commit(
            (d) => {
                const m = d.menus[menuId]
                m.contentJson = contentJson
                m.renderedHtml = res.html
                m.renderedAt = this.clock.nowIso()
                m.renderError = null
                this.bumpScreensReferencingMenu(d, menuId)
            },
            { kind: 'menu', text: `“${menu.name}” updated — pushed to ${this.screensShowingMenu(menuId)} screen(s)` },
        )
        return { ok: true, error: null }
    }

    private screensShowingMenu(menuId: string): number {
        return Object.entries(this.state.assignments)
            .filter(([, ref]) => ref.kind === 'menu' && ref.id === menuId).length
    }

    private bumpScreensReferencingMenu(d: DemoState, menuId: string) {
        for (const [recordId, ref] of Object.entries(d.assignments)) {
            if (ref.kind === 'menu' && ref.id === menuId) {
                const rec = d.records[recordId]
                if (rec) rec.refreshVersion++
            }
        }
    }

    // ── Hardware (the physical scene) ────────────────────────

    addHardware(partial?: Partial<Pick<DemoHardware, 'x' | 'y' | 'w'>>): string {
        const id = uid('hw')
        this.commit(
            (d) => {
                d.hardware[id] = {
                    id,
                    x: partial?.x ?? 0.42,
                    y: partial?.y ?? 0.25,
                    w: partial?.w ?? 0.16,
                    orientation: 'landscape',
                    powered: false,
                    playerInserted: false,
                    storedToken: null,
                    pairingCode: null,
                    cachedManifest: null,
                }
            },
            { kind: 'scene', text: 'Display mounted on the wall' },
        )
        return id
    }

    updateHardware(id: string, patch: Partial<DemoHardware>) {
        this.commit((d) => {
            const hw = d.hardware[id]
            if (hw) Object.assign(hw, patch)
        })
    }

    removeHardware(id: string) {
        this.commit(
            (d) => {
                delete d.hardware[id]
                const rec = Object.values(d.records).find((r) => r.hardwareId === id)
                if (rec) {
                    delete d.records[rec.id]
                    delete d.assignments[rec.id]
                    this.reindexSet(d, rec.setId)
                }
            },
            { kind: 'scene', text: 'Display removed' },
        )
    }

    setPowered(id: string, powered: boolean) {
        const hw = this.state.hardware[id]
        if (!hw || hw.powered === powered) return
        this.commit(
            (d) => { d.hardware[id].powered = powered },
            { kind: 'power', text: `${this.hardwareLabel(id)} powered ${powered ? 'on' : 'off'}` },
        )
    }

    insertPlayer(id: string) {
        this.commit(
            (d) => { d.hardware[id].playerInserted = true },
            { kind: 'power', text: `Onesign USB player inserted into ${this.hardwareLabel(id)}` },
        )
    }

    private hardwareLabel(id: string): string {
        const rec = Object.values(this.state.records).find((r) => r.hardwareId === id)
        return rec ? `“${rec.name}”` : 'unpaired display'
    }

    // ── Pairing ──────────────────────────────────────────────

    /** Called by the TV when it boots with no stored token: mint the code
     *  it displays. Idempotent per unpaired boot. */
    ensurePairingCode(hardwareId: string): string {
        const hw = this.state.hardware[hardwareId]
        if (hw?.pairingCode) return hw.pairingCode
        const code = pairingCode()
        this.commit((d) => { d.hardware[hardwareId].pairingCode = code })
        return code
    }

    /** Phone-side claim. Creates the screen record (the display_screens
     *  row) and writes the token back "onto the stick". */
    pairByCode(
        code: string,
        opts: { name: string; setId: string | null },
    ): { ok: boolean; error?: string } {
        const normalized = code.trim().toUpperCase()
        const hw = Object.values(this.state.hardware).find(
            (h) => h.pairingCode === normalized && !h.storedToken,
        )
        if (!hw) return { ok: false, error: 'No display is showing that code' }

        const recordId = uid('scr')
        const token = uid('tok')
        this.commit(
            (d) => {
                d.records[recordId] = {
                    id: recordId,
                    name: opts.name || 'New screen',
                    token,
                    hardwareId: hw.id,
                    setId: opts.setId,
                    indexInSet: 0,
                    refreshVersion: 1,
                    contentEpoch: this.clock.nowIso(),
                }
                d.assignments[recordId] = { kind: 'none' }
                const device = d.hardware[hw.id]
                device.storedToken = token
                device.pairingCode = null
                this.reindexSet(d, opts.setId)
            },
            { kind: 'pair', text: `“${opts.name}” paired (code ${normalized})` },
        )
        return { ok: true }
    }

    // ── Content & sets ───────────────────────────────────────

    assignContent(recordId: string, ref: ContentRef) {
        const rec = this.state.records[recordId]
        if (!rec) return
        const label =
            ref.kind === 'menu' ? `menu “${this.state.menus[ref.id]?.name}”`
            : ref.kind === 'playlist' ? `playlist “${this.state.playlists[ref.id]?.name}”`
            : 'nothing'
        this.commit(
            (d) => {
                d.assignments[recordId] = ref
                const r = d.records[recordId]
                r.refreshVersion++
                r.contentEpoch = this.clock.nowIso()
            },
            { kind: 'content', text: `“${rec.name}” now showing ${label}` },
        )
    }

    moveToSet(recordId: string, setId: string | null) {
        const rec = this.state.records[recordId]
        if (!rec || rec.setId === setId) return
        const from = rec.setId
        this.commit(
            (d) => {
                d.records[recordId].setId = setId
                this.reindexSet(d, from)
                this.reindexSet(d, setId)
            },
            {
                kind: 'sync',
                text: `“${rec.name}” moved to ${setId ? `“${this.state.sets[setId]?.name}”` : 'no set'}`,
            },
        )
    }

    setSyncEnabled(setId: string, on: boolean) {
        const set = this.state.sets[setId]
        if (!set) return
        this.commit(
            (d) => {
                const s = d.sets[setId]
                s.syncEnabled = on
                // Lazy epoch init, exactly like the real manifest route.
                if (on && !s.syncEpoch) s.syncEpoch = this.clock.nowIso()
                for (const r of Object.values(d.records)) {
                    if (r.setId === setId) r.refreshVersion++
                }
            },
            { kind: 'sync', text: `Sync ${on ? 'enabled' : 'disabled'} on “${set.name}”` },
        )
    }

    /** Keep index_in_set contiguous, ordered by record id creation order. */
    private reindexSet(d: DemoState, setId: string | null) {
        if (!setId) return
        const members = Object.values(d.records)
            .filter((r) => r.setId === setId)
            .sort((a, b) => a.id.localeCompare(b.id))
        members.forEach((r, i) => {
            r.indexInSet = i
            r.refreshVersion++
        })
    }

    // ── Presenter/scene settings ─────────────────────────────

    setEditMode(on: boolean) {
        if (this.state.editMode === on) return
        this.commit((d) => { d.editMode = on })
    }

    setBackdrop(url: string | null) {
        this.commit(
            (d) => { d.backdropUrl = url },
            { kind: 'scene', text: url ? 'Reference photo loaded as backdrop' : 'Backdrop cleared' },
        )
    }

    // ── Venue network ────────────────────────────────────────

    setWifi(on: boolean) {
        if (this.state.wifi === on) return
        this.commit(
            (d) => { d.wifi = on },
            {
                kind: 'network',
                text: on
                    ? 'Venue internet restored — screens reconnecting'
                    : 'Venue internet DOWN — screens running on cached content',
            },
        )
    }

    // ── The manifest endpoint ────────────────────────────────
    // Async + latency + offline failure so screens exercise the same
    // fetch/retry/cache paths the real player runs.

    async getManifest(token: string): Promise<DemoManifest> {
        await new Promise((r) => setTimeout(r, NETWORK_LATENCY_MS * (0.6 + Math.random() * 0.8)))
        if (!this.state.wifi) throw new Error('offline')

        const rec = Object.values(this.state.records).find((r) => r.token === token)
        if (!rec) throw new Error('invalid-token')

        const ref = this.state.assignments[rec.id] ?? { kind: 'none' as const }
        const manifest: DemoManifest = {
            screen_id: rec.id,
            refresh_version: rec.refreshVersion,
            fit_mode: 'contain',
            media: { id: null, url: null, type: null },
            playlist: null,
            stream: null,
            html_menu: null,
            sync: null,
            next_check: null,
            fetched_at: this.clock.nowIso(),
        }

        if (ref.kind === 'menu') {
            const menu = this.state.menus[ref.id]
            if (menu?.renderedHtml) {
                manifest.html_menu = {
                    id: menu.id,
                    theme_key: menu.themeKey,
                    rendered_at: menu.renderedAt,
                    html: menu.renderedHtml,
                }
            }
        } else if (ref.kind === 'playlist') {
            const pl = this.state.playlists[ref.id]
            if (pl && pl.items.length > 0) {
                manifest.playlist = {
                    id: pl.id,
                    transition: pl.transition,
                    transition_duration_ms: pl.transitionDurationMs,
                    loop: pl.loop,
                    items: pl.items.map((it) => ({
                        id: it.id,
                        url: it.url,
                        type: 'image/svg+xml',
                        duration_seconds: it.durationSeconds,
                    })),
                }
            }
        }

        const set = rec.setId ? this.state.sets[rec.setId] : null
        if (set?.syncEnabled) {
            let epoch = set.syncEpoch
            if (!epoch) {
                epoch = this.clock.nowIso()
                this.commit((d) => { d.sets[set.id].syncEpoch = epoch! })
            }
            const count = Object.values(this.state.records).filter((r) => r.setId === set.id).length
            manifest.sync = {
                enabled: true,
                epoch,
                screen_index: rec.indexInSet,
                screen_count: count,
            }
        }

        return manifest
    }

    // ── Convenience lookups for the UI ───────────────────────

    recordForHardware(hardwareId: string): DemoScreenRecord | null {
        return Object.values(this.state.records).find((r) => r.hardwareId === hardwareId) ?? null
    }

    /** Where a synced set's playhead is right now — for the phone's sync
     *  readout. Same math the screens use, because it IS the same code. */
    syncReadout(setId: string): { slideIndex: number; cycleElapsedMs: number } | null {
        const set = this.state.sets[setId]
        if (!set?.syncEnabled || !set.syncEpoch) return null
        const member = Object.values(this.state.records).find((r) => r.setId === setId)
        if (!member) return null
        const ref = this.state.assignments[member.id]
        if (ref?.kind !== 'playlist') return null
        const pl = this.state.playlists[ref.id]
        if (!pl) return null
        const pos = computeSyncPosition(
            this.clock.now(),
            new Date(set.syncEpoch).getTime(),
            pl.items.map((it) => ({ duration_seconds: it.durationSeconds })),
            pl.transitionDurationMs,
            pl.loop,
            pl.transition,
        )
        return { slideIndex: pos.slideIndex, cycleElapsedMs: pos.cycleElapsedMs }
    }

    // ── Quick Start ──────────────────────────────────────────
    // One click from an empty room to the fully provisioned 3+1 setup.
    // Exists for presenter recovery (reset → back to a working room in
    // seconds) — the manual flow is the actual pitch.

    quickStart() {
        if (Object.keys(this.state.records).length > 0) return
        this.commit(
            (d) => {
                for (const p of PRESET_LAYOUT) {
                    const hwId = `hw-${p.key}`
                    const recId = `scr-${p.key}`
                    const token = `tok-${p.key}`
                    d.hardware[hwId] = {
                        id: hwId,
                        x: p.x, y: p.y, w: p.w,
                        orientation: 'landscape',
                        powered: true,
                        playerInserted: true,
                        storedToken: token,
                        pairingCode: null,
                        cachedManifest: null,
                    }
                    const setId = p.set === 'wall' ? 'set-wall' : 'set-counter'
                    d.records[recId] = {
                        id: recId,
                        name: p.name,
                        token,
                        hardwareId: hwId,
                        setId,
                        indexInSet: 0,
                        refreshVersion: 1,
                        contentEpoch: this.clock.nowIso(),
                    }
                    d.assignments[recId] =
                        p.set === 'wall'
                            ? { kind: 'playlist', id: 'playlist-promo' }
                            : { kind: 'menu', id: 'menu-panuozzi' }
                }
                this.reindexSet(d, 'set-wall')
                this.reindexSet(d, 'set-counter')
                d.sets['set-wall'].syncEnabled = true
                d.sets['set-wall'].syncEpoch = this.clock.nowIso()
            },
            { kind: 'scene', text: 'Quick start: wall of 3 (synced) + counter screen provisioned' },
        )
    }
}
