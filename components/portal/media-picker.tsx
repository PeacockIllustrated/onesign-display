'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { assignMedia } from '@/app/actions/assign-media'
import { assignPlaylist } from '@/app/actions/playlist-actions'
import { MediaPickerItem } from './media-picker-item'

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

export function MediaPicker({ screenId, assets, playlists = [] }: {
    screenId: string
    assets: Asset[]
    playlists?: Playlist[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [tab, setTab] = useState<'media' | 'playlists'>('media')

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
            {playlists.length > 0 && (
                <div className="flex gap-1 mb-3">
                    <button
                        onClick={() => setTab('media')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            tab === 'media'
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Media
                    </button>
                    <button
                        onClick={() => setTab('playlists')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            tab === 'playlists'
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Playlists
                    </button>
                </div>
            )}

            {tab === 'media' ? (
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
                        <div className="col-span-3 text-center text-xs text-gray-500 py-4">No assets found. Upload some first!</div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
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
                </div>
            )}
        </div>
    )
}
