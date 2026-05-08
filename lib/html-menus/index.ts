// Server-only render entry point. Importing this from a Server Component
// will trigger a Next/Turbopack error because the themes pull in
// `react-dom/server`. Server Components should use `./registry` instead;
// rendering should always go through API routes or server actions.

import 'server-only'
import type { HtmlMenuTheme, ThemeRenderResult } from './types'
import { unclesPanuozziTheme } from './themes/uncles-panuozzi'
import { unclesQuadrantTheme } from './themes/uncles-quadrant'

const THEMES: Record<string, HtmlMenuTheme<any>> = {
  [unclesPanuozziTheme.key]: unclesPanuozziTheme,
  [unclesQuadrantTheme.key]: unclesQuadrantTheme,
}

export function getTheme(key: string): HtmlMenuTheme<any> | null {
  return THEMES[key] ?? null
}

export function renderMenu(themeKey: string, contentJson: unknown): ThemeRenderResult {
  const theme = getTheme(themeKey)
  if (!theme) return { html: null, error: `Unknown theme: ${themeKey}` }
  const parsed = theme.schema.safeParse(contentJson)
  if (!parsed.success) {
    return { html: null, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') }
  }
  try {
    return { html: theme.render(parsed.data), error: null }
  } catch (e: any) {
    return { html: null, error: e?.message ?? 'Render failed' }
  }
}

export type { HtmlMenuTheme, ThemeRenderResult }
