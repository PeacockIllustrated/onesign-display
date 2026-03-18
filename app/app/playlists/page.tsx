import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ListVideo, Plus } from 'lucide-react'
import { createPlaylist } from '@/app/actions/playlist-actions'
import { ClientSelector } from '@/components/portal/client-selector'

export const metadata = {
    title: 'Playlists — Onesign Display',
    description: 'Manage your content playlists for digital menu boards.',
}

export default async function PlaylistsPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('display_profiles').select('role, client_id').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'

    // Super admin: get all clients for selector
    let availableClients: { id: string, name: string }[] = []
    let activeClientId = profile?.client_id

    if (isSuperAdmin) {
        const { data: clients } = await supabase.from('display_clients').select('id, name').order('name')
        availableClients = clients || []
        activeClientId = searchClientId || availableClients[0]?.id || null
    }

    // Fetch playlists scoped to active client
    let query = supabase
        .from('display_playlists')
        .select('*, display_playlist_items(count)')
        .order('created_at', { ascending: false })

    if (activeClientId) {
        query = query.eq('client_id', activeClientId)
    }

    const { data: playlists } = await query

    // Get usage counts
    const playlistIds = playlists?.map(p => p.id) || []
    let usageCounts: Record<string, number> = {}

    if (playlistIds.length > 0) {
        const { data: usageData } = await supabase
            .from('display_screen_content')
            .select('playlist_id')
            .in('playlist_id', playlistIds)
            .eq('active', true)

        if (usageData) {
            for (const row of usageData) {
                if (row.playlist_id) {
                    usageCounts[row.playlist_id] = (usageCounts[row.playlist_id] || 0) + 1
                }
            }
        }
    }

    const transitionLabels: Record<string, string> = {
        fade: 'Fade',
        cut: 'Cut',
        slide_left: 'Slide Left',
        slide_right: 'Slide Right',
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-zinc-900">Playlists</h1>
                    {isSuperAdmin && (
                        <ClientSelector clients={availableClients} activeClientId={activeClientId || undefined} />
                    )}
                </div>
                {activeClientId && (
                    <form action={async () => {
                        'use server'
                        await createPlaylist(activeClientId!, 'New Playlist')
                    }}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            New Playlist
                        </button>
                    </form>
                )}
            </div>

            {(!playlists || playlists.length === 0) ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <ListVideo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No playlists yet</h3>
                    <p className="text-sm text-gray-500">
                        {isSuperAdmin && activeClientId
                            ? 'Create a playlist for this client to rotate content on their screens.'
                            : 'Create a playlist to rotate multiple images and videos on your screens.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map((playlist: any) => {
                        const itemCount = Array.isArray(playlist.display_playlist_items)
                            ? playlist.display_playlist_items[0]?.count || 0
                            : 0
                        const screenCount = usageCounts[playlist.id] || 0

                        return (
                            <Link
                                key={playlist.id}
                                href={`/app/playlists/${playlist.id}`}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div className="h-28 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center gap-1 px-4">
                                    {[0.8, 0.6, 0.4].map((opacity, i) => (
                                        <div
                                            key={i}
                                            className="w-9 h-12 rounded"
                                            style={{ backgroundColor: '#4e7e8c', opacity }}
                                        />
                                    ))}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm text-gray-900">{playlist.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {itemCount} {itemCount === 1 ? 'slide' : 'slides'} · {transitionLabels[playlist.transition] || playlist.transition}
                                    </p>
                                    {screenCount > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Used by {screenCount} {screenCount === 1 ? 'screen' : 'screens'}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
