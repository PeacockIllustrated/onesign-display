'use server'

// Lightweight menu actions safe to import from Server Components.
// Heavy actions that need react-dom/server (createMenu, saveAndRenderMenu)
// live in `./menu-render-actions` to keep that import graph out of RSCs.

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logContentAssigned } from '@/lib/screen-events'

export async function renameMenu(menuId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase
    .from('display_html_menus')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', menuId)
  if (error) throw new Error('Failed to rename menu')
  revalidatePath('/app/menus')
  revalidatePath(`/app/menus/${menuId}`)
}

export async function deleteMenu(menuId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  await bumpScreensReferencingMenu(menuId)
  const { error } = await supabase.from('display_html_menus').delete().eq('id', menuId)
  if (error) throw new Error('Failed to delete menu')
  revalidatePath('/app/menus')
}

export async function assignMenu(screenId: string, menuId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: screen } = await supabase
    .from('display_screens')
    .select('id, refresh_version, store:display_stores(client_id)')
    .eq('id', screenId)
    .single()
  if (!screen) throw new Error('Screen not found')

  const { data: profile } = await supabase
    .from('display_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  const storeClientId = (screen.store as any)?.client_id
  const isSuperAdmin = profile?.role === 'super_admin'
  const isOwner = profile?.role === 'client_admin' && profile.client_id === storeClientId
  if (!isSuperAdmin && !isOwner) throw new Error('Forbidden: Insufficient permissions')

  await supabase
    .from('display_screen_content')
    .update({ active: false })
    .eq('screen_id', screenId)
    .eq('active', true)

  const { error } = await supabase.from('display_screen_content').insert({
    screen_id: screenId,
    html_menu_id: menuId,
    active: true,
  })
  if (error) {
    console.error('Failed to assign menu:', error)
    throw new Error('Failed to assign menu')
  }

  const newVersion = (screen.refresh_version || 0) + 1
  await supabase.from('display_screens').update({ refresh_version: newVersion }).eq('id', screenId)

  await logContentAssigned(supabase, screenId, 'html_menu', menuId, user.id)

  revalidatePath(`/app/screens/${screenId}`, 'page')
}

// Bump refresh_version on every screen referencing this menu — covers both the
// active screen_content row and any scheduled rows. Triggers manifest cache
// invalidation + smart-refresh wakeup on the next /api/player/refresh poll.
export async function bumpScreensReferencingMenu(menuId: string) {
  const supabase = await createClient()

  const { data: activeRows } = await supabase
    .from('display_screen_content')
    .select('screen_id')
    .eq('html_menu_id', menuId)
    .eq('active', true)

  const { data: scheduledRows } = await supabase
    .from('display_scheduled_screen_content')
    .select('screen_id')
    .eq('html_menu_id', menuId)

  const screenIds = new Set<string>()
  for (const r of activeRows ?? []) screenIds.add((r as any).screen_id)
  for (const r of scheduledRows ?? []) screenIds.add((r as any).screen_id)

  if (screenIds.size === 0) return

  const ids = Array.from(screenIds)
  const { data: screens } = await supabase
    .from('display_screens')
    .select('id, refresh_version')
    .in('id', ids)

  await Promise.all(
    (screens ?? []).map((s: any) =>
      supabase
        .from('display_screens')
        .update({ refresh_version: (s.refresh_version || 0) + 1 })
        .eq('id', s.id)
    )
  )
}
