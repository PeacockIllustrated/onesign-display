import { createClient } from '@/lib/supabase/server'
import { MediaUploader } from '@/components/portal/media-uploader'
import { ClientSelector } from '@/components/portal/client-selector'
import { HelpIcon } from '@/components/ui/help-icon'
import { MediaLibrary } from './MediaLibrary'

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: role } = await supabase.from('display_profiles').select('client_id, role').eq('id', user.id).single()

    let activeClientId = role?.client_id
    let availableClients: { id: string, name: string }[] = []

    if (role?.role === 'super_admin') {
        const { data: clients } = await supabase.from('display_clients').select('id, name').order('name')
        availableClients = clients || []
        activeClientId = searchClientId || availableClients[0]?.id
    }

    // Fetch all assets for this client
    let query = supabase.from('display_media_assets').select('*').order('created_at', { ascending: false })
    if (activeClientId) {
        query = query.eq('client_id', activeClientId)
    }
    const { data: assets } = await query

    // Fetch which assets are actively in use (on screens or in playlists)
    const assetIds = assets?.map(a => a.id) || []
    const inUseIds = new Set<string>()

    if (assetIds.length > 0) {
        // Check screen_content (active assignments)
        const { data: screenUsage } = await supabase
            .from('display_screen_content')
            .select('media_asset_id')
            .in('media_asset_id', assetIds)
            .eq('active', true)

        screenUsage?.forEach(r => { if (r.media_asset_id) inUseIds.add(r.media_asset_id) })

        // Check playlist items
        const { data: playlistUsage } = await supabase
            .from('display_playlist_items')
            .select('media_asset_id')
            .in('media_asset_id', assetIds)

        playlistUsage?.forEach(r => { if (r.media_asset_id) inUseIds.add(r.media_asset_id) })

        // Check scheduled content
        const { data: scheduleUsage } = await supabase
            .from('display_scheduled_screen_content')
            .select('media_asset_id')
            .in('media_asset_id', assetIds)

        scheduleUsage?.forEach(r => { if (r.media_asset_id) inUseIds.add(r.media_asset_id) })
    }

    // Compute stats
    const totalCount = assets?.length || 0
    const imageCount = assets?.filter(a => a.mime?.startsWith('image/')).length || 0
    const videoCount = assets?.filter(a => a.mime?.startsWith('video/')).length || 0
    const totalSizeBytes = assets?.reduce((sum, a) => sum + (a.bytes || 0), 0) || 0
    const inUseCount = inUseIds.size

    const formatSize = (bytes: number) => {
        if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
        if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
        return `${Math.round(bytes / 1024)} KB`
    }

    // Add inUse flag to each asset
    const enrichedAssets = (assets || []).map(a => ({
        ...a,
        inUse: inUseIds.has(a.id),
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">Media Library</h1>
                        <HelpIcon section="media" />
                    </div>
                    {role?.role === 'super_admin' && (
                        <ClientSelector clients={availableClients} />
                    )}
                </div>
                <MediaUploader
                    clientId={activeClientId}
                    btnClassName="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
                />
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-3 text-xs">
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-gray-600">
                    <span className="font-semibold text-gray-900">{totalCount}</span> total
                </div>
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-gray-600">
                    <span className="font-semibold text-gray-900">{imageCount}</span> images
                </div>
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-gray-600">
                    <span className="font-semibold text-gray-900">{videoCount}</span> videos
                </div>
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-gray-600">
                    <span className="font-semibold text-gray-900">{inUseCount}</span> in use
                </div>
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-gray-600">
                    <span className="font-semibold text-gray-900">{formatSize(totalSizeBytes)}</span> storage
                </div>
            </div>

            {/* Client-side filterable gallery */}
            <MediaLibrary assets={enrichedAssets} />
        </div>
    )
}
