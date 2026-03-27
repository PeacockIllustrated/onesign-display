import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Radio, Plus, Volume2, VolumeX } from 'lucide-react'
import { ClientSelector } from '@/components/portal/client-selector'
import { deleteStream } from '@/app/actions/stream-actions'

export const metadata = {
    title: 'Live Streams — Onesign Display',
    description: 'Manage live HLS/DASH streams for your digital signage screens.',
}

export default async function StreamsPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('display_profiles').select('role, client_id').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'

    let availableClients: { id: string; name: string }[] = []
    let activeClientId = profile?.client_id

    if (isSuperAdmin) {
        const { data: clients } = await supabase.from('display_clients').select('id, name').order('name')
        availableClients = clients || []
        activeClientId = searchClientId || availableClients[0]?.id || null
    }

    let query = supabase
        .from('display_streams')
        .select('*')
        .order('created_at', { ascending: false })

    if (activeClientId) {
        query = query.eq('client_id', activeClientId)
    }

    const { data: streams } = await query

    // Get usage counts
    const streamIds = streams?.map(s => s.id) || []
    let usageCounts: Record<string, number> = {}

    if (streamIds.length > 0) {
        const { data: usageData } = await supabase
            .from('display_screen_content')
            .select('stream_id')
            .in('stream_id', streamIds)
            .eq('active', true)

        if (usageData) {
            for (const row of usageData) {
                if (row.stream_id) {
                    usageCounts[row.stream_id] = (usageCounts[row.stream_id] || 0) + 1
                }
            }
        }
    }

    const typeBadge: Record<string, string> = {
        hls: 'HLS',
        dash: 'DASH',
        embed: 'Embed',
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-zinc-900">Live Streams</h1>
                    {isSuperAdmin && (
                        <ClientSelector clients={availableClients} activeClientId={activeClientId || undefined} />
                    )}
                </div>
                {activeClientId && (
                    <Link
                        href={`/app/streams/new${isSuperAdmin ? `?clientId=${activeClientId}` : ''}`}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Stream
                    </Link>
                )}
            </div>

            {(!streams || streams.length === 0) ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No live streams yet</h3>
                    <p className="text-sm text-gray-500">
                        Add an HLS or DASH stream URL to display live feeds on your screens.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {streams.map((stream: any) => {
                        const screenCount = usageCounts[stream.id] || 0

                        return (
                            <div
                                key={stream.id}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                            >
                                <div className="h-28 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center relative">
                                    <Radio className="w-10 h-10 text-red-400 animate-pulse" />
                                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Live
                                    </span>
                                </div>
                                <div className="p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-sm text-gray-900 flex-1 truncate">{stream.name}</h3>
                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                            {typeBadge[stream.stream_type] || stream.stream_type}
                                        </span>
                                        {stream.audio_enabled ? (
                                            <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                                        ) : (
                                            <VolumeX className="w-3.5 h-3.5 text-gray-300" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 truncate mb-2">{stream.stream_url}</p>
                                    <div className="flex items-center justify-between">
                                        {screenCount > 0 && (
                                            <p className="text-xs text-gray-400">
                                                {screenCount} {screenCount === 1 ? 'screen' : 'screens'}
                                            </p>
                                        )}
                                        <div className="flex gap-2 ml-auto">
                                            <Link
                                                href={`/app/streams/${stream.id}`}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                Edit
                                            </Link>
                                            <form action={async () => {
                                                'use server'
                                                await deleteStream(stream.id)
                                            }}>
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
