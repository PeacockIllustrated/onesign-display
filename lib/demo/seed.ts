// Seed data for the demo simulator: promo slides, initial platform
// content, and the preset wall layout used by Quick Start.
//
// The slides are inline SVG data URIs so the demo is fully self-contained —
// nothing on these screens ever depends on a network fetch. Palette matches
// lib/html-menus/themes/_shared/brand.ts so playlist slides and HTML menus
// read as one brand on the wall.

import type { DemoState, DemoMenu, DemoPlaylist } from './types'

const G = {
    greenDeep: '#0E1914',
    greenBase: '#13241D',
    gold: '#C7A06A',
    goldBright: '#D9B681',
    cream: '#E8DDC7',
}

// SVG is XML: every interpolated string must be entity-escaped or a stray
// "&" silently kills the whole slide (naturalWidth 0, black panel).
function xml(s: string): string {
    return s.replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!),
    )
}

function svgSlide(raw: { eyebrow: string; title: string; sub: string }): string {
    // Uppercase BEFORE escaping — &apos; must not become &APOS;.
    const opts = {
        eyebrow: xml(raw.eyebrow.toUpperCase()),
        title: xml(raw.title.toUpperCase()),
        sub: xml(raw.sub),
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="glow" cx="30%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#2D4638" stop-opacity="0.75"/>
      <stop offset="60%" stop-color="${G.greenBase}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${G.greenBase}"/>
      <stop offset="100%" stop-color="${G.greenDeep}"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#base)"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  <rect x="30" y="30" width="1860" height="1020" fill="none" stroke="${G.gold}" stroke-opacity="0.45"/>
  <rect x="42" y="42" width="1836" height="996" fill="none" stroke="${G.gold}" stroke-opacity="0.2"/>
  <g transform="translate(960 300)">
    <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="${G.gold}"/>
    <rect x="-320" y="-1" width="270" height="1" fill="${G.gold}" opacity="0.5"/>
    <rect x="50" y="-1" width="270" height="1" fill="${G.gold}" opacity="0.5"/>
  </g>
  <text x="960" y="268" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" letter-spacing="18" fill="${G.goldBright}" opacity="0.9">${opts.eyebrow}</text>
  <text x="960" y="560" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="bold" letter-spacing="6" fill="${G.gold}">${opts.title}</text>
  <text x="960" y="680" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="44" letter-spacing="2" fill="${G.cream}" opacity="0.85">${opts.sub}</text>
  <g transform="translate(960 810)">
    <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="${G.gold}"/>
    <rect x="-320" y="-1" width="270" height="1" fill="${G.gold}" opacity="0.5"/>
    <rect x="50" y="-1" width="270" height="1" fill="${G.gold}" opacity="0.5"/>
  </g>
  <text x="960" y="960" text-anchor="middle" font-family="Verdana, sans-serif" font-size="24" letter-spacing="12" fill="${G.goldBright}" opacity="0.65">UNCLE'S · PANUOZZO &amp; SANDWICHES</text>
</svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const SEED_SLIDES = [
    svgSlide({
        eyebrow: 'Freshly baked daily',
        title: "Uncle's",
        sub: 'Panuozzo & sandwiches, made to order',
    }),
    svgSlide({
        eyebrow: 'This week',
        title: 'The Milano',
        sub: 'Mortadella al pistacchio · stracciatella · pistachio cream',
    }),
    svgSlide({
        eyebrow: 'After lunch',
        title: 'Dolce',
        sub: 'Tiramisu, cannoli & Italian coffee',
    }),
]

// ── Preset layout used by Quick Start ────────────────────────
// Three landscape screens as a wall row, one counter screen off to the
// right, slightly lower. All coordinates are wall fractions, so they
// survive a backdrop/reference-image swap.

export const PRESET_LAYOUT: {
    key: 'wall-1' | 'wall-2' | 'wall-3' | 'counter'
    x: number
    y: number
    w: number
    name: string
    set: 'wall' | 'counter'
}[] = [
    { key: 'wall-1', x: 0.13, y: 0.16, w: 0.175, name: 'Menu Wall — Left', set: 'wall' },
    { key: 'wall-2', x: 0.32, y: 0.16, w: 0.175, name: 'Menu Wall — Centre', set: 'wall' },
    { key: 'wall-3', x: 0.51, y: 0.16, w: 0.175, name: 'Menu Wall — Right', set: 'wall' },
    // Off to the side and lower — visibly its own set, and clear of the
    // control phone's default docking spot.
    { key: 'counter', x: 0.64, y: 0.52, w: 0.14, name: 'Counter Screen', set: 'counter' },
]

// ── Initial platform state ───────────────────────────────────
// Menus start unrendered (contentJson: null) — the driver hydrates them
// through /api/demo/render-menu, which uses each theme's real
// defaultContent and the real renderMenu(). That keeps the demo's menu
// pixels honest: same code path as production, no copied fixtures.

export function makeSeedState(): DemoState {
    const menus: Record<string, DemoMenu> = {
        'menu-panuozzi': {
            id: 'menu-panuozzi',
            name: 'Signature Panuozzi',
            themeKey: 'uncles-panuozzi',
            contentJson: null,
            renderedHtml: null,
            renderedAt: null,
            renderError: null,
        },
        'menu-quadrant': {
            id: 'menu-quadrant',
            name: 'Coffee · Drinks · Extras · Desserts',
            themeKey: 'uncles-quadrant',
            contentJson: null,
            renderedHtml: null,
            renderedAt: null,
            renderError: null,
        },
    }

    const playlists: Record<string, DemoPlaylist> = {
        'playlist-promo': {
            id: 'playlist-promo',
            name: 'House Promo Loop',
            transition: 'fade',
            transitionDurationMs: 800,
            loop: true,
            items: SEED_SLIDES.map((url, i) => ({
                id: `slide-${i + 1}`,
                url,
                durationSeconds: 6,
            })),
        },
    }

    return {
        version: 1,
        wifi: true,
        editMode: false,
        backdropUrl: null,
        hardware: {},
        records: {},
        sets: {
            'set-wall': { id: 'set-wall', name: 'Menu Wall', syncEnabled: false, syncEpoch: null },
            'set-counter': { id: 'set-counter', name: 'Counter', syncEnabled: false, syncEpoch: null },
        },
        menus,
        playlists,
        assignments: {},
        log: [],
    }
}
