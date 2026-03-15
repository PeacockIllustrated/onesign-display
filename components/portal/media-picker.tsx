'use client'

import { useState } from 'react'
import { SignedImage } from '@/components/ui/signed-image'
import { assignMedia } from '@/app/actions/assign-media'
import { Check, X } from 'lucide-react'
import { MediaPickerItem } from './media-picker-item'

// Define Asset Type locally or import from types
type Asset = {
    id: string
    filename: string
    storage_path: string
}

export function MediaPicker({ screenId, assets }: { screenId: string, assets: Asset[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleSelect = async (assetId: string) => {
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

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-900">Select Media</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {assets.map(asset => (
                    <MediaPickerItem
                        key={asset.id}
                        asset={asset}
                        disabled={saving}
                        onClick={() => handleSelect(asset.id)}
                    />
                ))}
                {assets.length === 0 && (
                    <div className="col-span-3 text-center text-xs text-gray-500 py-4">No assets found. Upload some first!</div>
                )}
            </div>
        </div>
    )
}
