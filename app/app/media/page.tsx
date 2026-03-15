import { createClient } from '@/lib/supabase/server'
import { MediaUploader } from '@/components/portal/media-uploader'
import { ClientSelector } from '@/components/portal/client-selector'
import { MediaItem } from './MediaItem'
import { HelpIcon } from '@/components/ui/help-icon'

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch Role
    const { data: role } = await supabase.from('profiles').select('client_id, role').eq('id', user.id).single()

    // Determine Active Client ID
    // 1. If Client Admin, use their ID (forcing it overrides searchParams)
    // 2. If Super Admin, use searchParams OR default to first client
    let activeClientId = role?.client_id
    let availableClients: { id: string, name: string }[] = []

    if (role?.role === 'super_admin') {
        const { data: clients } = await supabase.from('clients').select('id, name').order('name')
        availableClients = clients || []

        // Use search param or default to first
        activeClientId = searchClientId || availableClients[0]?.id
    }

    let query = supabase.from('media_assets').select('*').order('created_at', { ascending: false })

    // Filter by Active Client
    if (activeClientId) {
        query = query.eq('client_id', activeClientId)
    } else {
        // If no active client (e.g. super admin with no clients), ideally return nothing or global
        // But for now let's return nothing or handle gracefully
        if (role?.role === 'super_admin') {
            // Maybe show all? But user wants "relation to client". Let's show empty if no client selected.
            // Actually, if activeClientId is null here, it means no clients exist.
            // We can let query run (shows nothing if we want strict, or all if we want loose).
            // Let's force filter to 'null' if we want to be safe, but realistically activeClientId is UUID.
        }
    }

    const { data: assets } = await query

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
                <div className="flex gap-2 w-full md:w-auto">
                    <MediaUploader
                        clientId={activeClientId}
                        btnClassName="w-full md:w-auto bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
                    />
                </div>
            </div>

            {/* Simple Gallery Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {assets?.map((asset) => (
                    <MediaItem key={asset.id} asset={asset} />
                ))}

                {(!assets || assets.length === 0) && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No media found for this client.
                    </div>
                )}
            </div>
        </div>
    )
}
