import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { renderMenu } from '@/lib/html-menus'

// Returns the live-rendered HTML for the menu's saved content_json.
// Used by the editor's preview iframe (and as a quick visual check).
// RLS gates access through the user's session.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: menu, error } = await supabase
    .from('display_html_menus')
    .select('theme_key, content_json, rendered_html')
    .eq('id', id)
    .single()
  if (error || !menu) return new Response('Not found', { status: 404 })

  // Prefer fresh render so editor preview reflects current session content even
  // if the cached rendered_html is stale (no save yet).
  const result = renderMenu(menu.theme_key, menu.content_json)
  if (result.html) {
    return new Response(result.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  // Fall back to the last successful render so the preview never goes blank
  // because of a transient validation failure.
  if (menu.rendered_html) {
    return new Response(menu.rendered_html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  return new Response(`<!DOCTYPE html><html><body style="font:14px monospace;color:#c00;padding:20px">Render error: ${escape(result.error ?? 'Unknown')}</body></html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function escape(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
}
