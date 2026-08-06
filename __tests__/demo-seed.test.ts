import { describe, it, expect } from 'vitest'
import { SEED_SLIDES } from '@/lib/demo/seed'

// The demo's promo slides are inline SVG data URIs. SVG is XML, so one raw
// "&" in interpolated copy makes the whole slide undecodable — the screen
// shows a broken-image glyph instead of the slide, and nothing throws.
// (Found the hard way: "Panuozzo & sandwiches" blanked a third of the wall.)

// Any & that doesn't begin a well-formed entity is a parse error in XML.
const UNESCAPED_AMP = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/

describe('demo seed slides', () => {
    it('ships at least three slides as SVG data URIs', () => {
        expect(SEED_SLIDES.length).toBeGreaterThanOrEqual(3)
        for (const url of SEED_SLIDES) {
            expect(url.startsWith('data:image/svg+xml')).toBe(true)
        }
    })

    it.each(SEED_SLIDES.map((url, i) => [i, url]))(
        'slide %i is well-formed XML (no unescaped ampersands, balanced svg root)',
        (_i, url) => {
            const svg = decodeURIComponent(url.slice(url.indexOf(',') + 1))
            expect(svg).not.toMatch(UNESCAPED_AMP)
            expect(svg.startsWith('<svg')).toBe(true)
            expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
            // Uppercasing must happen before escaping — &APOS; is not an entity.
            expect(svg).not.toMatch(/&[A-Z]+;/)
        },
    )
})
