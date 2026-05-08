import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listThemes } from '@/lib/html-menus/registry'
import { createMenu } from '@/app/actions/menu-render-actions'

export const metadata = {
  title: 'New HTML Menu — Onesign Display',
}

export default async function NewMenuPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
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
  const clientId = isSuperAdmin ? searchClientId : profile?.client_id

  if (!clientId) {
    return <div className="text-center py-16 text-gray-500">No client selected.</div>
  }

  const themes = listThemes()

  async function handleCreate(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const themeKey = formData.get('theme_key') as string
    if (!name || !themeKey) throw new Error('Name and theme are required')
    const created = await createMenu(clientId!, name, themeKey)
    redirect(`/app/menus/${created.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/app/menus" className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">
          &larr; Back to Menus
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">New HTML Menu</h1>
        <p className="text-sm text-gray-500 mt-1">Pick a theme. You can edit the content next.</p>
      </div>

      <form action={handleCreate} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Menu name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="e.g. Lunch Menu — Panuozzi"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label htmlFor="theme_key" className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <select
            id="theme_key"
            name="theme_key"
            required
            defaultValue={themes[0]?.key}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
          >
            {themes.map((t) => (
              <option key={t.key} value={t.key}>
                {t.displayName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Theme is fixed once the menu is created. Make a new menu to switch themes.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/app/menus"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800">
            Create Menu
          </button>
        </div>
      </form>
    </div>
  )
}
