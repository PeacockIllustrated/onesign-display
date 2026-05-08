import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutTemplate, Plus } from 'lucide-react'
import { ClientSelector } from '@/components/portal/client-selector'
import { deleteMenu } from '@/app/actions/menu-actions'

export const metadata = {
  title: 'HTML Menus — Onesign Display',
  description: 'Editable themed menus rendered to your screens as HTML.',
}

export default async function MenusPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const { clientId: searchClientId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('display_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()
  const isSuperAdmin = profile?.role === 'super_admin'

  let availableClients: { id: string; name: string }[] = []
  let activeClientId = profile?.client_id

  if (isSuperAdmin) {
    const { data: clients } = await supabase.from('display_clients').select('id, name').order('name')
    availableClients = clients || []
    activeClientId = searchClientId || availableClients[0]?.id || null
  }

  let query = supabase
    .from('display_html_menus')
    .select('id, name, theme_key, rendered_at, render_error, updated_at')
    .order('updated_at', { ascending: false })

  if (activeClientId) query = query.eq('client_id', activeClientId)

  const { data: menus } = await query

  const menuIds = menus?.map((m) => m.id) || []
  const usage: Record<string, number> = {}
  if (menuIds.length > 0) {
    const { data: rows } = await supabase
      .from('display_screen_content')
      .select('html_menu_id')
      .in('html_menu_id', menuIds)
      .eq('active', true)
    for (const r of rows ?? []) {
      const k = (r as any).html_menu_id as string
      if (k) usage[k] = (usage[k] || 0) + 1
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-zinc-900">HTML Menus</h1>
          {isSuperAdmin && (
            <ClientSelector clients={availableClients} activeClientId={activeClientId || undefined} />
          )}
        </div>
        {activeClientId && (
          <Link
            href={`/app/menus/new${isSuperAdmin ? `?clientId=${activeClientId}` : ''}`}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Menu
          </Link>
        )}
      </div>

      {!menus || menus.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No HTML menus yet</h3>
          <p className="text-sm text-gray-500">
            Create a themed menu and edit its content live — changes appear on screens within seconds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((menu: any) => {
            const screenCount = usage[menu.id] || 0
            return (
              <div key={menu.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center">
                  <LayoutTemplate className="w-10 h-10 text-amber-300/70" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 flex-1 truncate">{menu.name}</h3>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {menu.theme_key}
                    </span>
                  </div>
                  {menu.render_error ? (
                    <p className="text-xs text-red-500 mb-2 truncate" title={menu.render_error}>
                      Render error
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-2">
                      {menu.rendered_at ? `Rendered ${new Date(menu.rendered_at).toLocaleString()}` : 'Not yet rendered'}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {screenCount > 0 && (
                      <p className="text-xs text-gray-400">
                        {screenCount} {screenCount === 1 ? 'screen' : 'screens'}
                      </p>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <Link href={`/app/menus/${menu.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          'use server'
                          await deleteMenu(menu.id)
                        }}
                      >
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
