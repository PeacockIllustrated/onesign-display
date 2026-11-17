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

- The logo is the dot-pixel lockup: "screens" built from halftone dots in the crew colours.
- Inline, animatable: `components/brand/ScreensLockup.tsx` (`reversed` for dark grounds, `animate` grows the dots in, `variant="solid"` for small sizes).
- Under about 56px tall the dots turn to texture, so use the `-solid` files (portal sidebar, navbar, footer).
- Static files: `public/brand/onedesign-screens-logo.svg` (light grounds), `-reversed.svg` (dark), `onedesign-screens-icon*.svg` (app tile).
- Splashes (`components/SplashScreen.tsx`, `components/portal/DashboardSplash.tsx`) both use `components/brand/BrandSplash.tsx`.

## Do not rename

These still say "onesign" on purpose; changing them breaks live screens or data:

- Supabase storage bucket `onesign-display`
- `localStorage` keys `onesign_*` (player tokens, manifest cache, onboarding)
- The `onesign-display.vercel.app` domain and the `webos-app/` LG wrapper (its LG store submission is in progress)
- `app/invoice/chez-frites` (issued under the Onesign & Digital name)

## Player reliability

- **Screens Player box** (Android stick + Fully Kiosk, `docs/android-stick-setup.md`) is the standard; TV browsers are best effort.
- Pairing: TVs open `/pair` and show a short code; the portal's screen page claims it (`app/api/player/pair`, `app/actions/pair-screen.ts`, table `display_pairing_codes`).
- Offline: `public/player/sw.js` caches the player and its media; the player posts its media list to it. The "no network" watchdog only reloads when a probe says the network is up.
- Heartbeats carry a device report saved to `display_screens.player_info` (shown on the screen page).
- Video uploads are checked in the browser (`lib/media/check-video.ts`) and warn about HEVC, ProRes, 4K, high bitrate and .mov.
- Offline email alerts (`lib/screen-alerts.ts`) run from the screen-status cron when `RESEND_API_KEY`, `SCREEN_ALERT_EMAIL` and `SCREEN_ALERT_FROM` are set.
- Migration `supabase/migrations/20261117_player_reliability.sql` must be applied for pairing and device reports.
- Tests: `npm test` (Vitest).
