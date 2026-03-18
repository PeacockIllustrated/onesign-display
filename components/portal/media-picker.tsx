'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerMediaAsset } from '@/app/app/media/actions'
import { assignMedia } from '@/app/actions/assign-media'
import { assignPlaylist } from '@/app/actions/playlist-actions'
import { MediaPickerItem } from './media-picker-item'
import { v4 as uuidv4 } from 'uuid'

type Asset = {
    id: string
    filename: string
    storage_path: string
}

type Playlist = {
    id: string
    name: string
    transition: string
    item_count: number
}

export function MediaPicker({ screenId, assets, playlists = [], clientId }: {
    screenId: string
    assets: Asset[]
    playlists?: Playlist[]
    clientId?: string
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [tab, setTab] = useState<'media' | 'playlists' | 'upload'>('media')
    const router = useRouter()

    const handleSelectMedia = async (assetId: string) => {
        setSaving(true)
        try {
            await assignMedia(screenId, assetId)
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert('Failed to assign media')
        } finally {
            setSaving(false)
        }
    }

    const handleSelectPlaylist = async (playlistId: string) => {
        setSaving(true)
        try {
            await assignPlaylist(screenId, playlistId)
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert('Failed to assign playlist')
        } finally {
            setSaving(false)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !clientId) return

        setUploading(true)
        const supabase = createClient()
        const files = Array.from(e.target.files)
        const errors: string[] = []

        for (const file of files) {
            try {
                const ext = file.name.split('.').pop()
                const storagePath = `${clientId}/${uuidv4()}.${ext}`

                const { error: uploadError } = await supabase.storage
                    .from('onesign-display')
                    .upload(storagePath, file)

                if (uploadError) throw new Error(uploadError.message)

                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Not authenticated')

                const result = await registerMediaAsset(clientId, file.name, storagePath, file.type, file.size, user.id, null)
                if (!result.success) throw new Error(result.error)
            } catch (err: any) {
                errors.push(`${file.name}: ${err.message}`)
            }
        }

        setUploading(false)
        e.target.value = ''

        if (errors.length > 0) {
            alert(`Some uploads failed:\n${errors.join('\n')}`)
        }

        // Refresh page to show newly uploaded media in the picker
        router.refresh()
        // Switch back to media tab so user can select the new upload
        setTab('media')
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
                Choose Media
            </button>
        )
    }

    const transitionLabels: Record<string, string> = {
        fade: 'Fade', cut: 'Cut', slide_left: 'Slide Left', slide_right: 'Slide Right',
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-900">Assign Content</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-3">
                <button
                    onClick={() => setTab('media')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        tab === 'media' ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Media
                </button>
                <button
                    onClick={() => setTab('playlists')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        tab === 'playlists' ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Playlists
                </button>
                {clientId && (
                    <button
                        onClick={() => setTab('upload')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                            tab === 'upload' ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Upload className="w-3 h-3" />
                        Upload
                    </button>
                )}
            </div>

            {/* Media tab */}
            {tab === 'media' && (
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {assets.map(asset => (
                        <MediaPickerItem
                            key={asset.id}
                            asset={asset}
                            disabled={saving}
                            onClick={() => handleSelectMedia(asset.id)}
                        />
                    ))}
                    {assets.length === 0 && (
                        <div className="col-span-3 text-center text-xs text-gray-500 py-4">
                            No assets found.
                            {clientId && (
                                <button onClick={() => setTab('upload')} className="text-indigo-600 hover:text-indigo-800 ml-1">
                                    Upload some
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Playlists tab */}
            {tab === 'playlists' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                        {playlists.map(pl => (
                            <button
                                key={pl.id}
                                onClick={() => handleSelectPlaylist(pl.id)}
                                disabled={saving}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-400 transition-colors text-left"
                            >
                                <p className="text-sm font-medium text-gray-900">{pl.name}</p>
                                <p className="text-xs text-gray-500">
                                    {pl.item_count} {pl.item_count === 1 ? 'slide' : 'slides'} · {transitionLabels[pl.transition] || pl.transition}
                                </p>
                            </button>
                        ))}
                        {playlists.length === 0 && (
                            <div className="col-span-2 text-center text-xs text-gray-500 py-4">
                                No playlists yet.
                            </div>
                        )}
                    </div>
                    <a
                        href="/app/playlists"
                        className="block w-full text-center py-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors"
                    >
                        + Create / Manage Playlists
                    </a>
                </div>
            )}

            {/* Upload tab */}
            {tab === 'upload' && clientId && (
                <div className="text-center py-6">
                    <div className="relative inline-block">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg px-8 py-6 hover:border-gray-400 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700">
                                {uploading ? 'Uploading...' : 'Drop files or click to browse'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Images & videos (JPG, PNG, WebP, GIF, MP4)</p>
                        </div>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
