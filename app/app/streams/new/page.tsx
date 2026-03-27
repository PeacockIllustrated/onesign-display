import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createStream } from '@/app/actions/stream-actions'
import Link from 'next/link'

export const metadata = {
    title: 'New Stream — Onesign Display',
    description: 'Add a live HLS or DASH stream to your digital signage.',
}

export default async function NewStreamPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('display_profiles').select('role, client_id').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'
    const clientId = isSuperAdmin ? searchClientId : profile?.client_id

    if (!clientId) {
        return <div className="text-center py-16 text-gray-500">No client selected.</div>
    }

    // Fetch media assets for fallback picker
    const { data: mediaAssets } = await supabase
        .from('display_media_assets')
        .select('id, filename, storage_path')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    async function handleCreate(formData: FormData) {
        'use server'
        const name = formData.get('name') as string
        const streamUrl = formData.get('stream_url') as string
        const streamType = formData.get('stream_type') as 'hls' | 'dash'
        const audioEnabled = formData.get('audio_enabled') === 'on'
        const fallbackId = formData.get('fallback_media_asset_id') as string || null

        if (!name || !streamUrl) throw new Error('Name and URL are required')

        await createStream(
            clientId!,
            name,
            streamUrl,
            streamType,
            audioEnabled,
            fallbackId || null
        )

        redirect('/app/streams')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link href="/app/streams" className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">&larr; Back to Streams</Link>
                <h1 className="text-2xl font-bold text-zinc-900">New Live Stream</h1>
                <p className="text-sm text-gray-500 mt-1">Add an HLS or DASH stream URL. The player will connect directly to this URL.</p>
            </div>

            <form action={handleCreate} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Stream Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="e.g. Sky Sports Main Event"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
                    />
                </div>

                {/* URL */}
                <div>
                    <label htmlFor="stream_url" className="block text-sm font-medium text-gray-700 mb-1">Stream URL</label>
                    <input
                        type="url"
                        id="stream_url"
                        name="stream_url"
                        required
                        placeholder="https://stream.example.com/live/playlist.m3u8"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        The HLS (.m3u8) or DASH (.mpd) URL from your encoder or streaming service.
                    </p>
                </div>

                {/* Type */}
                <div>
                    <label htmlFor="stream_type" className="block text-sm font-medium text-gray-700 mb-1">Stream Type</label>
                    <select
                        id="stream_type"
                        name="stream_type"
                        defaultValue="hls"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
                    >
                        <option value="hls">HLS (recommended)</option>
                        <option value="dash">DASH</option>
                    </select>
                </div>

                {/* Audio */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="audio_enabled"
                        name="audio_enabled"
                        className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label htmlFor="audio_enabled" className="text-sm text-gray-700">
                        Enable audio <span className="text-gray-400">(muted by default — most venues want silent screens)</span>
                    </label>
                </div>

                {/* Fallback Image */}
                <div>
                    <label htmlFor="fallback_media_asset_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Fallback Image <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <select
                        id="fallback_media_asset_id"
                        name="fallback_media_asset_id"
                        defaultValue=""
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
                    >
                        <option value="">No fallback (show &ldquo;Stream Offline&rdquo; message)</option>
                        {(mediaAssets || []).map((asset: any) => (
                            <option key={asset.id} value={asset.id}>{asset.filename}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                        Shown when the stream is unavailable. Upload an image first in the Media library.
                    </p>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                    <Link
                        href="/app/streams"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
                    >
                        Create Stream
                    </button>
                </div>
            </form>
        </div>
    )
}
