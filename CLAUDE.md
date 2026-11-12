# Onedesign Screens — agent notes

This repo is **Onedesign Screens** (formerly Onesign Display, before that Slate Signage):
a Next.js / Supabase digital menu streaming platform, now part of **Onedesign Studios**
(One Group, alongside OneSign).

The brand source of truth is the `PeacockIllustrated/one-design` repo (`DESIGN.md`,
`public/brand/`). Follow it; don't invent new brand colours or fonts here.

## Brand

| Key | Value |
|-----|-------|
| Product name | **Onedesign Screens** (lowercase "screens" in the logo) |
| Company | **Onedesign Studios** |
| Plan names | Screens Static, Screens Video, Screens Pro, Screens Enterprise |
| Player | Screens Player |
| Email | `studio@onedesignstudios.com` |
| Phone | `0191 487 6767` |
| Address | D86, Princesway North, Gateshead, NE11 0TU |
| Fonts | Gilroy (`public/fonts/*.ttf`), Martian Mono for small uppercase labels (`font-mono`) |
| Colours | `--od-*` tokens and `od-*` Tailwind colours in `app/globals.css` |

Zinc, gray and neutral are re-pointed in `app/globals.css` to Onedesign's warm paper
and ink-blue ramp, so existing classes like `text-zinc-500` are already on-brand.
Prefer `od-*` colours for anything new.

## Logo

- Inline, animatable: `components/brand/ScreensLockup.tsx` (`reversed` for dark grounds, `animate` for the pop-in).
- Static files: `public/brand/onedesign-screens-logo.svg` (light grounds), `-reversed.svg` (dark), `onedesign-screens-icon*.svg` (app tile).
- Splashes (`components/SplashScreen.tsx`, `components/portal/DashboardSplash.tsx`) both use `components/brand/BrandSplash.tsx`.

## Do not rename

These still say "onesign" on purpose; changing them breaks live screens or data:

- Supabase storage bucket `onesign-display`
- `localStorage` keys `onesign_*` (player tokens, manifest cache, onboarding)
- The `onesign-display.vercel.app` domain and the `webos-app/` LG wrapper (its LG store submission is in progress)
- `app/invoice/chez-frites` (issued under the Onesign & Digital name)
