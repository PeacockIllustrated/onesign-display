import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SignedImage } from '@/components/ui/signed-image'
import { MediaPicker } from '@/components/portal/media-picker'
import { EmptyScreenPreview } from '@/components/portal/empty-screen-preview'

export default async function ScreenDetailPage({ params }: { params: Promise<{ screenId: string }> }) {
    const { screenId } = await params
    const supabase = await createClient()

    // 1. Fetch User Role
    const { data: { user } } = await supabase.auth.getUser()
    const { data: role } = user ? await supabase.from('profiles').select('role').eq('id', user.id).single() : { data: null }

    // Fetch Screen
    const { data: screen } = await supabase
        .from('screens')
        .select(`
        *,
        store:stores(id, name),
        screen_content(
            *,
            media_asset:media_assets(*)
        )
    `)
        .eq('id', screenId)
        .single()

    if (!screen) return notFound()

    // Get active media
    const activeContent = Array.isArray(screen.screen_content)
        ? screen.screen_content.find((sc: any) => sc.active)
        : (screen.screen_content as any)?.active ? screen.screen_content : null

    const activeMedia = activeContent?.media_asset

    // Fetch available media for this client
    // Get client_id via store relation
    const { data: store } = await supabase.from('stores').select('client_id').eq('id', screen.store_id).single()
    const clientId = store?.client_id

    // Explicitly type or cast if needed, but select usually infers enough
    const { data: mediaAssets } = await supabase
        .from('media_assets')
        .select('id, filename, storage_path')
        .eq('client_id', clientId) // Filter by client
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <Link href={`/app/screen-sets/${screen.screen_set_id}`} className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">&larr; Back to Screen Set</Link>
                    <h1 className="text-2xl font-bold text-gray-900">Manage {screen.name}</h1>
                    <p className="text-gray-500 text-sm font-mono">Token: {screen.player_token}</p>
                    <div className="mt-1">
                        <Link
                            href={`/player/${screen.player_token}`}
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                        >
                            Open Player Link &rarr;
                        </Link>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm">
                        Reboot Player
                    </button>

                    {/* Delete Action - Super Admin Only */}
                    {role?.role === 'super_admin' && (
                        <form action={async () => {
                            'use server'
                            await import('@/app/actions/manage-screens').then(m => m.deleteScreen(screenId, screen.screen_set_id))
                        }}>
                            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">
                                Delete Screen
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 font-medium text-sm">Live Preview (Last Known)</div>
                        <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                            {activeMedia ? (
                                <SignedImage path={activeMedia.storage_path} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <EmptyScreenPreview />
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {screen.display_type} • {screen.orientation}
                            </div>
                        </div>
                    </div>

                    {/* Content Assignment */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Assignment</h3>

                        <div className="mb-4">
                            <MediaPicker screenId={screen.id} assets={mediaAssets || []} />
                        </div>

                        {activeMedia && (
                            <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                <div className="h-10 w-10 bg-gray-200 rounded overflow-hidden mr-3">
                                    <SignedImage path={activeMedia.storage_path} alt="Thumb" className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{activeMedia.filename}</p>
                                    <p className="text-xs text-gray-500">Active since {new Date(activeContent.assigned_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>

                        {role?.role === 'super_admin' ? (
                            <form action={async (formData) => {
                                'use server'
                                await import('@/app/actions/manage-screens').then(m => m.updateScreen(screenId, formData))
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input name="name" type="text" defaultValue={screen.name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Orientation</label>
                                    <select name="orientation" defaultValue={screen.orientation} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm">
                                        <option value="landscape">Landscape</option>
                                        <option value="portrait">Portrait</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Type</label>
                                    <select name="display_type" defaultValue={screen.display_type} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm">
                                        <option value="pc">PC / Web</option>
                                        <option value="android">Android</option>
                                        <option value="firestick">Amazon Fire Stick</option>
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 opacity-50 pointer-events-none">
                                <p className="text-sm text-gray-500 italic">Only super admins can edit settings.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input type="text" defaultValue={screen.name} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
