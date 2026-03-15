'use client'

import { useState, useEffect, useRef } from 'react'
import { SignedImage } from '@/components/ui/signed-image'
import { Loader2, Play } from 'lucide-react'

type Asset = {
    id: string
    filename: string
    storage_path: string
}

export function MediaPickerItem({ asset, onClick, disabled, selected }: { asset: Asset, onClick: () => void, disabled?: boolean, selected?: boolean }) {
    const isVideo = asset.filename.match(/\.(mp4|mov|webm)$/i)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (isVideo && !videoUrl) {
            fetch(`/api/signed-url?path=${encodeURIComponent(asset.storage_path)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.url) setVideoUrl(data.url)
                })
                .catch(console.error)
        }
    }, [isVideo, asset.storage_path, videoUrl])

    const handleMouseEnter = () => {
        if (videoRef.current && videoUrl) {
            videoRef.current.play().catch(() => { })
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative aspect-square border rounded overflow-hidden hover:ring-2 hover:ring-black focus:outline-none group ${selected ? 'ring-2 ring-black' : 'border-gray-200'}`}
            onMouseEnter={isVideo ? handleMouseEnter : undefined}
            onMouseLeave={isVideo ? handleMouseLeave : undefined}
        >
            {isVideo ? (
                videoUrl ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                )
            ) : (
                <SignedImage path={asset.storage_path} alt={asset.filename} className="w-full h-full object-cover" />
            )}

            {isVideo && (
                <div className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white">
                    <Play size={8} fill="currentColor" />
                </div>
            )}

            {disabled && <div className="absolute inset-0 bg-white/50 cursor-wait" />}
        </button>
    )
}
