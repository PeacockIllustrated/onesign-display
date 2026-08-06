import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { renderMenu, getTheme } from '@/lib/html-menus'
import { listThemes } from '@/lib/html-menus/registry'

const THEME_KEYS = listThemes().map((t) => t.key)

describe('html menu themes', () => {
    it('registers at least one theme', () => {
        expect(THEME_KEYS.length).toBeGreaterThan(0)
    })

    it.each(THEME_KEYS)('renders "%s" from its default content', (key) => {
        const theme = getTheme(key)
        expect(theme).not.toBeNull()

        const result = renderMenu(key, theme!.defaultContent)

        // createMenu throws if a theme cannot render its own defaults, so a
        // regression here would block menu creation outright.
        expect(result.error).toBeNull()
        expect(result.html).toBeTruthy()
        expect(result.html).toContain('<!DOCTYPE html>')
    })

    it('returns an error instead of HTML when content is invalid', () => {
        const result = renderMenu(THEME_KEYS[0], { nonsense: true })
        expect(result.html).toBeNull()
        expect(result.error).toBeTruthy()
    })

    it('returns an error for an unknown theme', () => {
        const result = renderMenu('does-not-exist', {})
        expect(result.html).toBeNull()
        expect(result.error).toContain('Unknown theme')
    })
})

// A live menu board must render correctly with no third-party network access.
// Fonts used to come from Google Fonts, so a venue losing connectivity silently
// dropped customer-facing menus to system fallback fonts while the screen
// otherwise kept playing from its cached manifest.
describe('html menu themes — no third-party dependencies', () => {
    const rendered = THEME_KEYS.map((key) => ({
        key,
        html: renderMenu(key, getTheme(key)!.defaultContent).html!,
    }))

    it.each(rendered)('$key references no external host', ({ html }) => {
        expect(html).not.toContain('fonts.googleapis.com')
        expect(html).not.toContain('fonts.gstatic.com')

        // Any absolute URL at all would be a network dependency at render time.
        // data: URIs are inline, so they are fine.
        const external = [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/g)]
        expect(external.map((m) => m[1])).toEqual([])

        const cssUrls = [...html.matchAll(/url\((["']?)(https?:\/\/[^)"']+)/g)]
        expect(cssUrls.map((m) => m[2])).toEqual([])
    })

    it.each(rendered)('$key serves fonts from our own origin', ({ html }) => {
        expect(html).toContain('@font-face')
        expect(html).toContain('/fonts/menus/')
    })

    it.each(rendered)('$key pins the CSP to same-origin fonts', ({ html }) => {
        expect(html).toContain("font-src 'self'")
        expect(html).not.toMatch(/font-src[^;]*https:/)
    })

    it.each(rendered)('$key only references font files that exist', ({ html }) => {
        const files = [...html.matchAll(/\/fonts\/menus\/([\w.-]+\.woff2)/g)].map((m) => m[1])
        expect(files.length).toBeGreaterThan(0)

        for (const file of new Set(files)) {
            expect(
                existsSync(path.join(process.cwd(), 'public', 'fonts', 'menus', file)),
                `missing font file: public/fonts/menus/${file}`,
            ).toBe(true)
        }
    })
})
