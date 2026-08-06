import { describe, it, expect, beforeEach } from 'vitest'
import { LocalDemoDriver } from '@/lib/demo/local-driver'
import { VirtualClock } from '@/lib/demo/virtual-clock'
import type { MenuRenderFn } from '@/lib/demo/types'

// The demo driver stands in for the real backend, so what matters is that
// it honours the same contracts: the manifest shape the player consumes,
// lazy sync-epoch init, and never letting a failed menu render clobber the
// last good HTML (mirroring app/actions/menu-render-actions.ts).

const okRender: MenuRenderFn = async (themeKey, contentJson) => ({
    html: `<!DOCTYPE html><html><body>render:${themeKey}</body></html>`,
    error: null,
    content: contentJson ?? { seeded: true },
})

const failRender: MenuRenderFn = async () => ({
    html: null,
    error: 'schema: boom',
    content: null,
})

function makeDriver(render: MenuRenderFn = okRender) {
    return new LocalDemoDriver(new VirtualClock(), render, false)
}

function provision(driver: LocalDemoDriver, name = 'Test screen', setId: string | null = 'set-wall') {
    const hwId = driver.addHardware()
    driver.setPowered(hwId, true)
    driver.insertPlayer(hwId)
    const code = driver.ensurePairingCode(hwId)
    const res = driver.pairByCode(code, { name, setId })
    expect(res.ok).toBe(true)
    const record = driver.recordForHardware(hwId)!
    return { hwId, record }
}

describe('LocalDemoDriver — pairing', () => {
    it('pairs a display by the code it shows and stores the token on the stick', () => {
        const driver = makeDriver()
        const { hwId, record } = provision(driver)

        expect(record.name).toBe('Test screen')
        expect(driver.getState().hardware[hwId].storedToken).toBe(record.token)
        // Code is consumed — the TV stops showing it.
        expect(driver.getState().hardware[hwId].pairingCode).toBeNull()
    })

    it('rejects a code no display is showing', () => {
        const driver = makeDriver()
        const res = driver.pairByCode('ZZZ-999', { name: 'X', setId: null })
        expect(res.ok).toBe(false)
        expect(res.error).toBeTruthy()
    })
})

describe('LocalDemoDriver — manifest contract', () => {
    beforeEach(() => { /* each test builds its own driver */ })

    it('serves the real manifest shape with html_menu inline', async () => {
        const driver = makeDriver()
        await driver.ensureMenusRendered()
        const { record } = provision(driver)
        driver.assignContent(record.id, { kind: 'menu', id: 'menu-panuozzi' })

        const manifest = await driver.getManifest(record.token)

        // Keys the real player relies on (mirrors /api/player/manifest).
        expect(Object.keys(manifest).sort()).toEqual(
            ['fetched_at', 'fit_mode', 'html_menu', 'media', 'next_check', 'playlist', 'refresh_version', 'screen_id', 'stream', 'sync'].sort(),
        )
        expect(manifest.html_menu?.html).toContain('render:uncles-panuozzi')
        expect(manifest.playlist).toBeNull()
    })

    it('fails like a dead network when venue wifi is down', async () => {
        const driver = makeDriver()
        const { record } = provision(driver)
        driver.setWifi(false)
        await expect(driver.getManifest(record.token)).rejects.toThrow('offline')
    })

    it('lazy-inits a sync epoch once and reports stable index/count', async () => {
        const driver = makeDriver()
        const a = provision(driver, 'A')
        const b = provision(driver, 'B')
        driver.assignContent(a.record.id, { kind: 'playlist', id: 'playlist-promo' })
        driver.assignContent(b.record.id, { kind: 'playlist', id: 'playlist-promo' })
        driver.setSyncEnabled('set-wall', true)

        const m1 = await driver.getManifest(a.record.token)
        const m2 = await driver.getManifest(b.record.token)

        expect(m1.sync?.enabled).toBe(true)
        expect(m1.sync?.epoch).toBe(m2.sync?.epoch) // shared epoch = shared timeline
        expect(m1.sync?.screen_count).toBe(2)
        expect(new Set([m1.sync?.screen_index, m2.sync?.screen_index])).toEqual(new Set([0, 1]))
    })
})

describe('LocalDemoDriver — menu saves', () => {
    it('keeps the last good render when a save fails to render', async () => {
        // First render succeeds…
        const flaky: MenuRenderFn = async (themeKey, contentJson) =>
            (contentJson as { broken?: boolean } | null)?.broken
                ? failRender(themeKey, contentJson)
                : okRender(themeKey, contentJson)

        const driver = makeDriver(flaky)
        await driver.ensureMenusRendered()
        const goodHtml = driver.getState().menus['menu-panuozzi'].renderedHtml
        expect(goodHtml).toBeTruthy()

        // …then a broken save must not clobber it.
        const res = await driver.saveMenu('menu-panuozzi', { broken: true })
        expect(res.ok).toBe(false)
        const menu = driver.getState().menus['menu-panuozzi']
        expect(menu.renderedHtml).toBe(goodHtml)
        expect(menu.renderError).toBe('schema: boom')
    })
})

describe('LocalDemoDriver — quick start', () => {
    it('provisions the preset 3+1 room with the wall synced', async () => {
        const driver = makeDriver()
        driver.quickStart()

        const state = driver.getState()
        expect(Object.keys(state.records)).toHaveLength(4)
        expect(state.sets['set-wall'].syncEnabled).toBe(true)
        expect(state.sets['set-wall'].syncEpoch).toBeTruthy()

        const wall = Object.values(state.records).filter((r) => r.setId === 'set-wall')
        expect(wall).toHaveLength(3)
        expect(wall.map((r) => r.indexInSet).sort()).toEqual([0, 1, 2])
        // Wall screens are synced onto the promo playlist; the counter shows a menu.
        for (const r of wall) {
            expect(state.assignments[r.id]).toEqual({ kind: 'playlist', id: 'playlist-promo' })
        }
    })
})
