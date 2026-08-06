'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { renderMenu, getTheme } from '@/lib/html-menus'
import { bumpScreensReferencingMenu } from './menu-actions'

export async function createMenu(clientId: string, name: string, themeKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('display_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()
  const isSuperAdmin = profile?.role === 'super_admin'
  const isOwner = profile?.role === 'client_admin' && profile.client_id === clientId
  if (!isSuperAdmin && !isOwner) throw new Error('Forbidden: Insufficient permissions')

  const theme = getTheme(themeKey)
  if (!theme) throw new Error(`Unknown theme: ${themeKey}`)

  const initial = renderMenu(themeKey, theme.defaultContent)

  // A theme that cannot render its own default content is broken. Fail here
  // rather than create a menu with no rendered HTML, which would blank any
  // screen it was later assigned to.
  if (!initial.html) {
    console.error(`Theme "${themeKey}" failed to render its default content:`, initial.error)
    throw new Error(`Theme "${themeKey}" could not be rendered`)
  }

  const { data, error } = await supabase
    .from('display_html_menus')
    .insert({
      client_id: clientId,
      name,
      theme_key: themeKey,
      content_json: theme.defaultContent as object,
      rendered_html: initial.html,
      rendered_at: new Date().toISOString(),
      render_error: null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create menu:', error)
    throw new Error('Failed to create menu')
  }

  revalidatePath('/app/menus')
  return data
}

export async function saveAndRenderMenu(menuId: string, contentJson: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing, error: fetchError } = await supabase
    .from('display_html_menus')
    .select('id, theme_key, client_id')
    .eq('id', menuId)
    .single()
  if (fetchError || !existing) throw new Error('Menu not found')

  const result = renderMenu(existing.theme_key, contentJson)

  // A failed render must never reach the screens. Writing result.html straight
  // through would store null, and the player manifest omits html_menu when
  // rendered_html is empty — with no fallback, because content resolution is an
  // else-if chain that has already committed to the menu branch. The board goes
  // black. So on failure: leave content_json and rendered_html untouched, record
  // why, and report back to the editor. The last good menu keeps playing.
  if (!result.html) {
    await supabase
      .from('display_html_menus')
      .update({ render_error: result.error, updated_at: new Date().toISOString() })
      .eq('id', menuId)

    return { rendered: false, error: result.error }
  }

  const { error: updateError } = await supabase
    .from('display_html_menus')
    .update({
      content_json: contentJson as object,
      rendered_html: result.html,
      rendered_at: new Date().toISOString(),
      render_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', menuId)

  if (updateError) {
    console.error('Failed to save menu:', updateError)
    throw new Error('Failed to save menu')
  }

  await bumpScreensReferencingMenu(menuId)
  revalidatePath(`/app/menus/${menuId}`)
  return { rendered: true, error: null }
}
