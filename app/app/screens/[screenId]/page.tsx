import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SignedImage } from '@/components/ui/signed-image'
import { MediaPicker } from '@/components/portal/media-picker'
import { EmptyScreenPreview } from '@/components/portal/empty-screen-preview'
import { ScreenSettingsForm } from '@/components/admin/screen-settings-form'
import { ListVideo } from 'lucide-react'

export default async function ScreenDetailPage({ params }: { params: Promise<{ screenId: string }> }) {
    const { screenId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: role } = user ? await supabase.from('display_profiles').select('role').eq('id', user.id).single() : { data: null }

    // Fetch Screen with content relations
    const { data: screen } = await supabase
        .from('display_screens')
        .select(`
        *,
        store:display_stores(id, name),
        display_screen_content(
            *,
            media_asset:display_media_assets(*),
            playlist:display_playlists(id, name, transition, transition_duration_ms, loop)
        )
    `)
        .eq('id', screenId)
        .single()

    if (!screen) return notFound()

    // Get active content (media or playlist)
    const activeContent = Array.isArray(screen.display_screen_content)
        ? screen.display_screen_content.find((sc: any) => sc.active)
        : (screen.display_screen_content as any)?.active ? screen.display_screen_content : null

    const activeMedia = activeContent?.media_asset
    const activePlaylist = activeContent?.playlist

    // If playlist is active, fetch its first item for preview thumbnail
    let playlistFirstItem: any = null
    let playlistItemCount = 0

    if (activePlaylist) {
        const { data: items } = await supabase
            .from('display_playlist_items')
            .select('*, media:display_media_assets(storage_path, mime, filename)')
            .eq('playlist_id', activePlaylist.id)
            .order('position', { ascending: true })

        playlistItemCount = items?.length || 0
        playlistFirstItem = items?.[0]?.media || null
    }

    // Fetch available media for this client
    const { data: store } = await supabase.from('display_stores').select('client_id').eq('id', screen.store_id).single()
    const clientId = store?.client_id

    const { data: mediaAssets } = await supabase
        .from('display_media_assets')
        .select('id, filename, storage_path')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    // Fetch playlists for this client
    const { data: playlistsRaw } = await supabase
        .from('display_playlists')
        .select('id, name, transition, display_playlist_items(count)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    const playlists = (playlistsRaw || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        transition: p.transition,
        item_count: Array.isArray(p.display_playlist_items) ? p.display_playlist_items[0]?.count || 0 : 0,
    }))

    const transitionLabels: Record<string, string> = {
        fade: 'Fade', cut: 'Cut', slide_left: 'Slide Left', slide_right: 'Slide Right',
    }

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
                            {activePlaylist ? (
                                // Playlist preview: show first slide with playlist overlay
                                <>
                                    {playlistFirstItem ? (
                                        <SignedImage
                                            path={playlistFirstItem.storage_path}
                                            alt="Playlist preview"
                                            className="w-full h-full object-contain"
                                            mime={playlistFirstItem.mime}
                                        />
                                    ) : (
                                        <div className="text-gray-500 text-sm">Empty playlist</div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/70 text-white px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                                        <ListVideo className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">{activePlaylist.name}</span>
                                        <span className="text-xs text-gray-400">· {playlistItemCount} slides · {transitionLabels[activePlaylist.transition] || activePlaylist.transition}</span>
                                    </div>
                                </>
                            ) : activeMedia ? (
                                <SignedImage path={activeMedia.storage_path} alt="Preview" className="w-full h-full object-contain" mime={activeMedia.mime} />
                            ) : (
                                <EmptyScreenPreview />
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {screen.display_type} · {screen.orientation}
                            </div>
                        </div>
                    </div>

                    {/* Content Assignment */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Assignment</h3>

                        <div className="mb-4">
                            <MediaPicker screenId={screen.id} assets={mediaAssets || []} playlists={playlists} clientId={clientId} />
                        </div>

                        {/* Active content info card */}
                        {activePlaylist && (
                            <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                <div className="h-10 w-10 bg-gray-800 rounded overflow-hidden mr-3 flex items-center justify-center flex-shrink-0">
                                    <ListVideo className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{activePlaylist.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Playlist · {playlistItemCount} {playlistItemCount === 1 ? 'slide' : 'slides'} · {transitionLabels[activePlaylist.transition] || activePlaylist.transition}
                                    </p>
                                </div>
                                <Link
                                    href={`/app/playlists/${activePlaylist.id}`}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0"
                                >
                                    Edit
                                </Link>
                            </div>
                        )}

                        {activeMedia && !activePlaylist && (
                            <div className="flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                <div className="h-10 w-10 bg-gray-200 rounded overflow-hidden mr-3 flex-shrink-0">
                                    <SignedImage path={activeMedia.storage_path} alt="Thumb" className="h-full w-full object-cover" mime={activeMedia.mime} />
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
                            <ScreenSettingsForm
                                screenId={screenId}
                                screen={{ name: screen.name, orientation: screen.orientation, display_type: screen.display_type }}
                            />
                        ) : (
                            <div className="space-y-4 opacity-50 pointer-events-none">
                                <p className="text-sm text-gray-500 italic">Only super admins can edit settings.</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input type="text" defaultValue={screen.name} readOnly className="mt-1 block w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 shadow-sm" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
