# Onesign Display — Rebrand Agent Instructions

You are working on `slate-signage`, a Next.js 15 / Supabase digital menu streaming platform.
Your job is to rebrand it as **Onesign Display** — Onesign & Digital's own digital menu product.

This is a focused rebrand: **logos, wording, metadata, and splashscreen only**.
Do NOT change the colour palette, layout, or component structure. CSS stays as-is.

---

## Brand Identity

| Key | Value |
|-----|-------|
| Product name | **Onesign Display** |
| Company | **Onesign & Digital** |
| Short name (in-UI) | **Onesign** |
| Domain | `display.onesignanddigital.com` (use as placeholder) |
| Email | `sales@onesignanddigital.com` |
| Phone | `0191 487 6767` |
| Address | D86, Princesway North, Gateshead, NE11 0TU |
| Copyright | `© 2026 Onesign & Digital` |
| Accent colour | `#4e7e8c` (Onesign teal) |
| Logo file (dark bg) | `public/onesign-logo-white.png` |
| Logo file (light bg) | `public/onesign-logo-dark.png` |

---

## String Replacements — apply globally across all `.tsx`, `.ts`, `.mdx`, `README.md`

| Find | Replace with |
|------|-------------|
| `Slate Signage` | `Onesign Display` |
| `Slate signage` | `Onesign Display` |
| `slate-signage` | `onesign-display` (in metadata/descriptions only — NOT in import paths or file refs) |
| `slate signage` | `Onesign Display` |
| `Slate` (standalone brand reference) | `Onesign` |
| `slate.app` | `display.onesignanddigital.com` |
| `© 2026 Slate Signage` | `© 2026 Onesign & Digital` |
| `/slate-logo.png` | `/onesign-logo-white.png` |

**Pricing plan names** (in `app/pricing/page.tsx` or equivalent):
| Find | Replace |
|------|---------|
| `Slate Static` | `Onesign Static` |
| `Slate Video` | `Onesign Video` |
| `Slate Pro` | `Onesign Pro` |
| `Slate Enterprise` | `Onesign Enterprise` |

---

## Footer Tagline

Replace:
> "Design defines the system. Slate operates it."

With:
> "Your brand on every screen. Managed by Onesign."

---

## Page Metadata — update in `app/layout.tsx` and each page's `metadata` export

```ts
// app/layout.tsx
export const metadata: Metadata = {
  title: 'Onesign Display — Digital Menu Streaming',
  description: 'Stream your menus to every screen. Update prices, schedule dayparts, and manage every location — all from one dashboard. By Onesign & Digital.',
  openGraph: {
    siteName: 'Onesign Display',
    title: 'Onesign Display — Digital Menu Streaming',
    description: 'Menu boards that run themselves. By the sign-making experts at Onesign & Digital.',
  },
}
```

Page-level metadata replacements:
| Page | New title | New description |
|------|-----------|-----------------|
| `/` (homepage) | `Stream your menus. Schedule your day. — Onesign Display` | `The digital menu platform built for busy hospitality teams. Update prices, swap specials, and schedule content in seconds.` |
| `/product` | `How Onesign Display works` | `From kitchen to screen in four simple steps. Menu boards that run themselves.` |
| `/studio` | `Specials Studio — Onesign Display` | `Create eye-catching daily specials in 30 seconds. No design skills required.` |
| `/pricing` | `Digital Menu Board Pricing — Onesign Display` | `Simple monthly pricing. Every plan includes scheduling, unlimited updates, and Onesign design included.` |
| `/templates` | `Menu Templates — Onesign Display` | `Pre-built digital menu layouts designed by the Onesign team.` |

---

## Logo Component

Find the logo `<Image>` or `<img>` tag(s) in `components/` and `app/` (likely in a Navbar/Header component).

Replace:
```tsx
<Image src="/slate-logo.png" alt="Slate Signage" ... />
```
With:
```tsx
<Image src="/onesign-logo-white.png" alt="Onesign Display" width={140} height={32} />
```

If there's a dark-background variant needed (e.g. on the player screen), use `onesign-logo-white.png`.
If on a light background, use `onesign-logo-dark.png`.

---

## Logo Assets

**Download these two logo files** and save into `public/`:

1. White logo (for dark nav):
   `https://static.wixstatic.com/media/653dfa_ea4e2d45d7ca408b95493574790bc8b5~mv2.png`
   → save as `public/onesign-logo-white.png`

2. For a dark logo variant, use the same file — the Wix CDN doesn't serve an inverted version,
   so save the same PNG as `public/onesign-logo-dark.png` for now and note it needs a proper
   dark version from the Onesign brand files.

---

## Splashscreen Component

Create `components/SplashScreen.tsx` using the code from `SPLASHSCREEN_COMPONENT.md` in this repo.

Then in `app/layout.tsx`, import and render it at the top of the body **before** the main content:

```tsx
import SplashScreen from '@/components/SplashScreen'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
```

---

## README.md — Replace entirely with:

```markdown
# Onesign Display

Digital menu streaming platform by Onesign & Digital.

Stream menus to screens, schedule dayparts, and update prices from one dashboard.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (Postgres)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth

## Architecture
- **Admin Portal**: `/app` (Protected)
- **Player**: `/player/[token]` (Public, Token-gated)
- **API**: `/api/*` (Ingest, Player Manifest, Signed URLs)

## Getting Started
1. `npm install`
2. Copy `.env.example` → `.env.local` and fill Supabase credentials
3. Run SQL scripts in `supabase/` to set up schema
4. `npm run dev`

## Contact
sales@onesignanddigital.com · 0191 487 6767
```

---

## Execution Order

1. Download logo assets into `public/`
2. Global string replacements (all files)
3. Update `app/layout.tsx` — metadata + SplashScreen import
4. Update each page's metadata export
5. Update logo `<Image>` tags in navbar/header components
6. Update footer tagline
7. Update pricing plan names
8. Create `components/SplashScreen.tsx`
9. Replace README.md
10. Final grep pass: `grep -r "Slate" --include="*.tsx" --include="*.ts"` — fix any remaining hits