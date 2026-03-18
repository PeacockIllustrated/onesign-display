'use client'

import { useState } from 'react'
import { GripVertical, Trash2, Plus, X, Film } from 'lucide-react'
import { SignedImage } from '@/components/ui/signed-image'
import {
    updatePlaylist,
    deletePlaylist,
    addPlaylistItem,
    removePlaylistItem,
    reorderPlaylistItems,
    updateItemDuration,
} from '@/app/actions/playlist-actions'

type PlaylistItem = {
    id: string
    position: number
    duration_seconds: number
    media: {
        id: string
        filename: string
        storage_path: string
        mime: string
        duration: number | null
    } | null
}

type MediaAsset = {
    id: string
    filename: string
    storage_path: string
    mime: string
}

export function PlaylistEditor({
    playlist,
    items: initialItems,
    availableMedia,
}: {
    playlist: any
    items: PlaylistItem[]
    availableMedia: MediaAsset[]
}) {
    const [items, setItems] = useState(initialItems)
    const [showMediaPicker, setShowMediaPicker] = useState(false)
    const [saving, setSaving] = useState(false)
    const [dragIndex, setDragIndex] = useState<number | null>(null)

    const isVideo = (mime: string) => mime?.startsWith('video/')

    const handleDragStart = (index: number) => {
        setDragIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (dragIndex === null || dragIndex === index) return

        const newItems = [...items]
        const [moved] = newItems.splice(dragIndex, 1)
        newItems.splice(index, 0, moved)
        setItems(newItems)
        setDragIndex(index)
    }

    const handleDragEnd = async () => {
        setDragIndex(null)
        // Save new order
        const itemIds = items.map(item => item.id)
        await reorderPlaylistItems(playlist.id, itemIds)
    }

    const handleAddItem = async (mediaAssetId: string) => {
        setSaving(true)
        try {
            await addPlaylistItem(playlist.id, mediaAssetId)
            setShowMediaPicker(false)
        } catch (e: any) {
            alert(e.message || 'Failed to add item')
        } finally {
            setSaving(false)
        }
    }

    const handleRemoveItem = async (itemId: string) => {
        setSaving(true)
        try {
            await removePlaylistItem(playlist.id, itemId)
            setItems(prev => prev.filter(i => i.id !== itemId))
        } catch (e: any) {
            alert(e.message || 'Failed to remove item')
        } finally {
            setSaving(false)
        }
    }

    const handleDurationChange = async (itemId: string, seconds: number) => {
        if (seconds < 1 || seconds > 300) return
        await updateItemDuration(playlist.id, itemId, seconds)
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, duration_seconds: seconds } : i))
    }

    const handleDeletePlaylist = async () => {
        if (!confirm('Delete this playlist? Screens using it will show no content until reassigned.')) return
        await deletePlaylist(playlist.id)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Slide list */}
            <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Slides ({items.length})</h3>
                </div>

                {items.map((item, index) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 transition-opacity ${dragIndex === index ? 'opacity-50' : ''}`}
                    >
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab flex-shrink-0" />

                        <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {item.media && (
                                <SignedImage
                                    path={item.media.storage_path}
                                    alt={item.media.filename}
                                    className="w-full h-full object-cover"
                                    mime={item.media.mime}
                                />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.media?.filename}</p>
                            <p className="text-xs text-gray-500">
                                {item.media && isVideo(item.media.mime) ? (
                                    <span className="flex items-center gap-1">
                                        <Film className="w-3 h-3" /> Video · plays full length
                                    </span>
                                ) : (
                                    `Image · ${item.duration_seconds}s`
                                )}
                            </p>
                        </div>

                        {item.media && !isVideo(item.media.mime) && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <input
                                    type="number"
                                    min={1}
                                    max={300}
                                    defaultValue={item.duration_seconds}
                                    onBlur={(e) => handleDurationChange(item.id, parseInt(e.target.value) || 10)}
                                    className="w-14 text-center text-sm border border-gray-300 rounded px-1 py-0.5"
                                />
                                <span className="text-xs text-gray-400">sec</span>
                            </div>
                        )}

                        <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={saving}
                            className="text-red-400 hover:text-red-600 flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Add media button / picker */}
                {showMediaPicker ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Add Media</h4>
                            <button onClick={() => setShowMediaPicker(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {availableMedia.map(asset => (
                                <button
                                    key={asset.id}
                                    onClick={() => handleAddItem(asset.id)}
                                    disabled={saving}
                                    className="bg-white border border-gray-200 rounded p-2 hover:border-gray-400 transition-colors text-left"
                                >
                                    <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-1">
                                        <SignedImage path={asset.storage_path} alt={asset.filename} className="w-full h-full object-cover" mime={asset.mime} />
                                    </div>
                                    <p className="text-xs text-gray-700 truncate">{asset.filename}</p>
                                </button>
                            ))}
                            {availableMedia.length === 0 && (
                                <p className="col-span-3 text-center text-xs text-gray-500 py-4">No media available. Upload some first.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm font-medium hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Media
                    </button>
                )}
            </div>

            {/* Right: Settings */}
            <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Settings</h3>

                    <form action={async (formData) => {
                        await updatePlaylist(playlist.id, formData)
                    }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Playlist Name</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={playlist.name}
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transition</label>
                            <select
                                name="transition"
                                defaultValue={playlist.transition}
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                <option value="fade">Fade</option>
                                <option value="cut">Cut (Instant)</option>
                                <option value="slide_left">Slide Left</option>
                                <option value="slide_right">Slide Right</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transition Duration</label>
                            <div className="flex items-center gap-2">
                                <input
                                    name="transitionDuration"
                                    type="number"
                                    min={0}
                                    max={5000}
                                    defaultValue={playlist.transition_duration_ms}
                                    className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                />
                                <span className="text-xs text-gray-500">ms</span>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    name="loop"
                                    type="checkbox"
                                    defaultChecked={playlist.loop}
                                    className="rounded border-gray-300"
                                    style={{ accentColor: '#4e7e8c' }}
                                />
                                Loop continuously
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 text-sm font-medium"
                        >
                            Save Settings
                        </button>
                    </form>
                </div>

                <button
                    onClick={handleDeletePlaylist}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                >
                    Delete Playlist
                </button>
            </div>
        </div>
    )
}
