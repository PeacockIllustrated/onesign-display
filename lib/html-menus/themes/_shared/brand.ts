export const unclesPalette = {
  greenDeep: '#0E1914',
  greenBase: '#13241D',
  greenMid: '#1C2F26',
  gold: '#C7A06A',
  goldBright: '#D9B681',
  goldSoft: '#A88654',
  goldFaint: 'rgba(199, 160, 106, 0.22)',
  goldLine: 'rgba(199, 160, 106, 0.45)',
  cream: '#E8DDC7',
  creamSoft: 'rgba(232, 221, 199, 0.78)',
} as const

// Fonts are self-hosted from our own origin (public/fonts/menus). They used to
// come from Google Fonts, which made every live menu board quietly dependent on
// reaching a third party: when a venue's connection dropped, the stylesheet
// request failed and the board fell back to system fonts. Screens keep playing
// from their cached manifest in that situation, so the typography was the only
// thing that broke — silently, and on the customer-facing side.
//
// Google serves both families as variable fonts, so one file per family/style
// covers the 400–600 range the themes use. See public/fonts/menus/README.md.

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, ' +
  'U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, ' +
  'U+2212, U+2215, U+FEFF, U+FFFD'

const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, ' +
  'U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, ' +
  'U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'

function fontFace(family: string, style: 'normal' | 'italic', file: string, range: string): string {
  return (
    '@font-face{' +
    `font-family:'${family}';` +
    `font-style:${style};` +
    'font-weight:400 600;' +
    'font-display:swap;' +
    `src:url(/fonts/menus/${file}) format('woff2');` +
    `unicode-range:${range};` +
    '}'
  )
}

export const unclesFontFaceCss = [
  fontFace('Cormorant Garamond', 'normal', 'cormorant-garamond-latin.woff2', LATIN),
  fontFace('Cormorant Garamond', 'normal', 'cormorant-garamond-latin-ext.woff2', LATIN_EXT),
  fontFace('Cormorant Garamond', 'italic', 'cormorant-garamond-italic-latin.woff2', LATIN),
  fontFace('Cormorant Garamond', 'italic', 'cormorant-garamond-italic-latin-ext.woff2', LATIN_EXT),
  fontFace('Inter', 'normal', 'inter-latin.woff2', LATIN),
  fontFace('Inter', 'normal', 'inter-latin-ext.woff2', LATIN_EXT),
].join('')

export const csp =
  "default-src 'self' data:; " +
  "style-src 'unsafe-inline'; " +
  "font-src 'self'; " +
  "img-src 'self' data: https:; " +
  "script-src 'none';"

export function unclesRootCss(): string {
  return `
    :root {
      --green-deep:  ${unclesPalette.greenDeep};
      --green-base:  ${unclesPalette.greenBase};
      --green-mid:   ${unclesPalette.greenMid};
      --gold:        ${unclesPalette.gold};
      --gold-bright: ${unclesPalette.goldBright};
      --gold-soft:   ${unclesPalette.goldSoft};
      --gold-faint:  ${unclesPalette.goldFaint};
      --gold-line:   ${unclesPalette.goldLine};
      --cream:       ${unclesPalette.cream};
      --cream-soft:  ${unclesPalette.creamSoft};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      font-family: 'Cormorant Garamond', serif;
      color: var(--gold);
      background: var(--green-base);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    body {
      position: relative;
      background:
        radial-gradient(ellipse 60% 50% at 25% 18%, rgba(45, 70, 56, 0.7) 0%, transparent 60%),
        radial-gradient(ellipse 70% 60% at 78% 85%, rgba(8, 16, 12, 0.85) 0%, transparent 55%),
        linear-gradient(135deg, var(--green-base) 0%, var(--green-deep) 100%);
    }
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.78  0 0 0 0 0.63  0 0 0 0 0.42  0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      opacity: 0.5;
      mix-blend-mode: overlay;
      pointer-events: none;
      z-index: 1;
    }
    body::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(8, 14, 11, 0.4) 100%);
      pointer-events: none;
      z-index: 1;
    }
    .frame-outer {
      position: absolute;
      inset: 30px;
      border: 1px solid var(--gold-line);
      pointer-events: none;
      z-index: 3;
    }
    .frame-inner {
      position: absolute;
      inset: 42px;
      border: 1px solid var(--gold-faint);
      pointer-events: none;
      z-index: 3;
    }
    .corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 1px solid var(--gold);
      transform: rotate(45deg);
      background: radial-gradient(circle, var(--green-base) 30%, var(--green-deep) 100%);
      z-index: 4;
    }
    .corner.tl { left: 22px; top: 22px; }
    .corner.tr { right: 22px; top: 22px; }
    .corner.bl { left: 22px; bottom: 22px; }
    .corner.br { right: 22px; bottom: 22px; }
    .corner::after {
      content: '';
      position: absolute;
      inset: 4px;
      background: var(--gold);
      transform: scale(0.4);
      opacity: 0.5;
    }
    .stage {
      position: relative;
      width: 1920px;
      height: 1080px;
      padding: 56px 130px 90px;
      display: grid;
      grid-template-rows: auto 1fr;
      z-index: 5;
    }
    .header { text-align: center; margin-bottom: 4px; }
    .brand-logo {
      width: 700px;
      margin: 0 auto;
      line-height: 0;
    }
    .brand-logo svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .section-band {
      position: relative;
      margin: 22px auto 0;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 26px;
      padding: 0 80px;
    }
    .section-line-l, .section-line-r {
      flex: 1;
      height: 1px;
      max-width: 360px;
    }
    .section-line-l { background: linear-gradient(90deg, transparent, var(--gold-faint) 30%, var(--gold) 100%); }
    .section-line-r { background: linear-gradient(90deg, var(--gold) 0%, var(--gold-faint) 70%, transparent); }
    .section-title {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 500;
      font-size: 36px;
      letter-spacing: 0.42em;
      color: var(--gold);
      text-transform: uppercase;
      line-height: 1;
      white-space: nowrap;
    }
    .section-band-diamond {
      color: var(--gold);
      font-size: 14px;
      transform: rotate(45deg);
      display: inline-block;
    }
    .tagline {
      text-align: center;
      margin-top: 14px;
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 21px;
      letter-spacing: 0.04em;
      color: var(--cream-soft);
      opacity: 0.85;
    }
  `
}
