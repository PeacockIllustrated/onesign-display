import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { updateStream } from '@/app/actions/stream-actions'
import Link from 'next/link'

export const metadata = {
    title: 'Edit Stream — Onesign Display',
    description: 'Update a live HLS or DASH stream configuration.',
}

export default async function EditStreamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('display_profiles').select('role, client_id').eq('id', user.id).single()
    const isSuperAdmin = profile?.role === 'super_admin'

    // Fetch the stream
    const { data: stream } = await supabase
        .from('display_streams')
        .select('*')
        .eq('id', id)
        .single()

    if (!stream) notFound()

    // Permission check: client_admin can only edit their own streams
    if (!isSuperAdmin && profile?.client_id !== stream.client_id) {
        notFound()
    }

    // Fetch media assets for fallback picker
    const { data: mediaAssets } = await supabase
        .from('display_media_assets')
        .select('id, filename, storage_path')
        .eq('client_id', stream.client_id)
        .order('created_at', { ascending: false })

    // Fetch usage count
    const { data: usageData } = await supabase
        .from('display_screen_content')
        .select('screen_id, screen:display_screens(name)')
        .eq('stream_id', id)
        .eq('active', true)

    const screenCount = usageData?.length || 0

    async function handleUpdate(formData: FormData) {
        'use server'
        const name = formData.get('name') as string
        const streamUrl = formData.get('stream_url') as string
        const streamType = formData.get('stream_type') as 'hls' | 'dash' | 'embed'
        const audioEnabled = formData.get('audio_enabled') === 'on'
        const fallbackId = formData.get('fallback_media_asset_id') as string || null

        if (!name || !streamUrl) throw new Error('Name and URL are required')

        await updateStream(id, {
            name,
            stream_url: streamUrl,
            stream_type: streamType,
            audio_enabled: audioEnabled,
            fallback_media_asset_id: fallbackId || null,
        })

        redirect('/app/streams')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link href="/app/streams" className="text-sm text-gray-500 hover:text-gray-900 mb-1 block">&larr; Back to Streams</Link>
                <h1 className="text-2xl font-bold text-zinc-900">Edit Stream</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Update the stream configuration. Changes apply immediately to all screens using this stream.
                </p>
            </div>

            {/* Usage info */}
            {screenCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
                    <p className="text-sm text-blue-800">
                        This stream is currently live on <strong>{screenCount} {screenCount === 1 ? 'screen' : 'screens'}</strong>.
                        {usageData && usageData.length <= 5 && (
                            <span className="text-blue-600">
                                {' '}({usageData.map((u: any) => u.screen?.name || 'Unnamed').join(', ')})
                            </span>
                        )}
                    </p>
                </div>
            )}

            <form action={handleUpdate} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Stream Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        defaultValue={stream.name}
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
                        defaultValue={stream.stream_url}
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
                        defaultValue={stream.stream_type}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
                    >
                        <option value="hls">HLS (recommended)</option>
                        <option value="dash">DASH</option>
                        <option value="embed">Embed (iframe)</option>
                    </select>
                </div>

                {/* Audio */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="audio_enabled"
                        name="audio_enabled"
                        defaultChecked={stream.audio_enabled}
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
                        defaultValue={stream.fallback_media_asset_id || ''}
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
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}
