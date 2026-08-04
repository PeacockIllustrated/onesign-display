# Brochures

Print-ready PDFs built from HTML and rendered through headless Chromium.

| File | What it is |
|------|-----------|
| `onesign-display-pitch.html` | **Capability Overview** — 10-page deck framed around food, coffee and promotions. Source for `Onesign-Display-Capability-Overview.pdf`. |
| `onesign-display-brochure.html` | Original general product overview. Source for `Onesign-Display-Product-Overview.pdf`. |
| `brochure.css` | Shared design system (page grid, device mockups, pricing cards, cover). Extracted from the original brochure so both documents stay visually identical. |

## Building

```bash
npm run docs:fonts    # once — inlines Gilroy + DM Sans as data URIs
npm run docs:pitch    # renders the capability overview to PDF
npm run docs:layout   # optional — per-page PNGs + overflow report
```

`docs:fonts` writes `docs/fonts.css` (~1.4 MB, gitignored). It reads the licensed
Gilroy TTFs from `public/fonts/` and fetches DM Sans from Google Fonts once, then
embeds everything as base64. This matters: Gilroy's public CDN
(`fonts.cdnfonts.com`) is unreliable, and when it fails the browser silently falls
back to a system sans — the PDF still renders, just off-brand. `render-pdf.mjs`
asserts Gilroy actually loaded and fails the build rather than shipping fallback
type.

## Editing

Content lives in the HTML. `brochure.css` is shared, so put document-specific
overrides in that document's own `<style>` block rather than editing the shared
sheet.

After any content change run `npm run docs:layout` — it reports each page's fill
percentage and flags any page whose content overflows past the footer. Pages sit
around 91–93% fill; overflow is invisible on screen and only shows up in the PDF.
