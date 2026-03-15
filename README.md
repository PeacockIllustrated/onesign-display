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