# Menu theme fonts

Self-hosted so HTML menus render identically with no third-party network access.
These were previously loaded from Google Fonts, which meant a venue's connection
dropping silently degraded live menu boards to system fallback fonts.

Google serves both families as **variable** fonts, so one file per family/style
covers the full 400–600 weight range the themes use. The `-latin-ext` files are
only fetched by the browser when a glyph in that range actually appears.

| File | Family | Style |
|---|---|---|
| `cormorant-garamond-latin.woff2` | Cormorant Garamond | normal |
| `cormorant-garamond-latin-ext.woff2` | Cormorant Garamond | normal |
| `cormorant-garamond-italic-latin.woff2` | Cormorant Garamond | italic |
| `cormorant-garamond-italic-latin-ext.woff2` | Cormorant Garamond | italic |
| `inter-latin.woff2` | Inter | normal |
| `inter-latin-ext.woff2` | Inter | normal |

272 KB total. Served with a one-year immutable cache header (see
`next.config.ts`) so a player caches them indefinitely after first load.

The `@font-face` declarations that reference these live in
`lib/html-menus/themes/_shared/brand.ts`.

## Licence

Both families are licensed under the SIL Open Font License 1.1 — full text in
`OFL.txt`, which permits redistribution and self-hosting.

- Inter — Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)
- Cormorant Garamond — Copyright 2015 The Cormorant Project Authors (https://github.com/CatharsisFonts/Cormorant)

## Updating

Re-download from the Google Fonts CSS API with a browser User-Agent (to get
woff2), keep only the `latin` and `latin-ext` subsets, and drop the duplicate
per-weight files — every weight of a given family/style is byte-identical.
