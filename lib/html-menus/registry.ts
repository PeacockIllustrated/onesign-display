// Lightweight theme registry — safe to import from Server Components.
// Holds only metadata (key + display name). The render functions live in
// `./render` and import react-dom/server, which Next/Turbopack disallows in
// Server Component import graphs. Pages that need the render output route
// through API endpoints / server actions which import `./render`.

export type ThemeMeta = { key: string; displayName: string }

const META: ThemeMeta[] = [
  { key: 'uncles-panuozzi', displayName: "Uncle's — Signature Panuozzi (1920×1080)" },
  { key: 'uncles-quadrant', displayName: "Uncle's — Coffee · Drinks · Extras · Desserts (1920×1080)" },
]

export function listThemes(): ThemeMeta[] {
  return META
}

export function getThemeMeta(key: string): ThemeMeta | null {
  return META.find((m) => m.key === key) ?? null
}
