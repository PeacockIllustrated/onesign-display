import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PlaylistEditor } from '@/components/admin/playlist-editor'

export default async function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return notFound()

    // Fetch playlist with items
    const { data: playlist } = await supabase
        .from('display_playlists')
        .select('*')
        .eq('id', id)
        .single()

    if (!playlist) return notFound()

    // Fetch items with media info
    const { data: items } = await supabase
        .from('display_playlist_items')
        .select('*, media:display_media_assets(id, filename, storage_path, mime, duration)')
        .eq('playlist_id', id)
        .order('position', { ascending: true })

    // Fetch available media — super admin sees all, client admin sees own
    const { data: profile } = await supabase.from('display_profiles').select('role, client_id').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'

    let mediaQuery = supabase
        .from('display_media_assets')
        .select('id, filename, storage_path, mime')
        .order('created_at', { ascending: false })

    if (!isSuperAdmin) {
        mediaQuery = mediaQuery.eq('client_id', playlist.client_id)
    }

    const { data: mediaAssets } = await mediaQuery

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <Link href="/app/playlists" className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">
                    &larr; Back to Playlists
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Playlist</h1>
            </div>

            <PlaylistEditor
                playlist={playlist}
                items={items || []}
                availableMedia={mediaAssets || []}
            />
        </div>
    )
}
