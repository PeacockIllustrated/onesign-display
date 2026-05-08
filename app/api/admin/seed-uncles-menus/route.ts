import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getTheme, renderMenu } from '@/lib/html-menus'

// One-shot seed for the Uncle's Panuozzo trial. Super-admin only.
// Usage:
//   GET /api/admin/seed-uncles-menus?clientId=<uuid>
//
// Inserts two display_html_menus rows for the given client populated with
// Tom's default content for the Signature Panuozzi and Coffee/Drinks/Extras/
// Desserts screens, both rendered to HTML on insert. Idempotent: skips if
// menus with the seed names already exist for that client.
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('display_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const seeds = [
    { name: "Uncle's — Signature Panuozzi", themeKey: 'uncles-panuozzi' },
    { name: "Uncle's — Coffee, Drinks, Extras & Desserts", themeKey: 'uncles-quadrant' },
  ]

  const results: { name: string; status: 'created' | 'skipped' | 'failed'; id?: string; error?: string }[] = []

  for (const s of seeds) {
    const { data: existing } = await supabase
      .from('display_html_menus')
      .select('id')
      .eq('client_id', clientId)
      .eq('name', s.name)
      .maybeSingle()
    if (existing) {
      results.push({ name: s.name, status: 'skipped', id: existing.id })
      continue
    }

    const theme = getTheme(s.themeKey)
    if (!theme) {
      results.push({ name: s.name, status: 'failed', error: `Unknown theme: ${s.themeKey}` })
      continue
    }

    const rendered = renderMenu(s.themeKey, theme.defaultContent)
    if (rendered.error) {
      results.push({ name: s.name, status: 'failed', error: rendered.error })
      continue
    }

    const { data: inserted, error } = await supabase
      .from('display_html_menus')
      .insert({
        client_id: clientId,
        name: s.name,
        theme_key: s.themeKey,
        content_json: theme.defaultContent as object,
        rendered_html: rendered.html,
        rendered_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !inserted) {
      results.push({ name: s.name, status: 'failed', error: error?.message ?? 'Insert failed' })
    } else {
      results.push({ name: s.name, status: 'created', id: inserted.id })
    }
  }

  return NextResponse.json({ results })
}
