import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MenuEditorShell } from '@/components/menus/MenuEditorShell'
import { renameMenu } from '@/app/actions/menu-actions'

export const metadata = {
  title: 'Edit Menu — Onesign Display',
}

export default async function MenuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: menu, error } = await supabase
    .from('display_html_menus')
    .select('id, client_id, name, theme_key, content_json, render_error, rendered_at')
    .eq('id', id)
    .single()

  if (error || !menu) notFound()

  async function handleRename(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    if (!name) return
    await renameMenu(id, name)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/app/menus" className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">
            &larr; Back to Menus
          </Link>
          <form action={handleRename} className="flex items-center gap-2">
            <input
              type="text"
              name="name"
              defaultValue={menu.name}
              className="text-2xl font-bold text-zinc-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:outline-none px-1"
            />
            <button type="submit" className="text-xs text-gray-500 hover:text-black">
              Save name
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-1">
            Theme: <span className="font-mono">{menu.theme_key}</span>
            {menu.rendered_at ? ` · last rendered ${new Date(menu.rendered_at).toLocaleString()}` : null}
          </p>
        </div>
      </div>

      {menu.render_error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-2 rounded">
          <strong>Render error:</strong> <span className="font-mono whitespace-pre-wrap">{menu.render_error}</span>
        </div>
      ) : null}

      <MenuEditorShell
        menuId={menu.id}
        themeKey={menu.theme_key}
        initialContent={menu.content_json}
      />
    </div>
  )
}
