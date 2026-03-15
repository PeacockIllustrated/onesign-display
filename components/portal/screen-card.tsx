'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SignedImage } from '@/components/ui/signed-image'
import { Play, Loader2 } from 'lucide-react'

interface ScreenCardProps {
    screen: {
        id: string
        name: string
        orientation: string
        display_type: string
        last_seen_at?: string
        screen_content?: any | any[]
    }
}

export function ScreenCard({ screen }: ScreenCardProps) {
    const activeMedia = Array.isArray(screen.screen_content)
        ? screen.screen_content[0]?.media_asset
        : screen.screen_content?.media_asset

    const videoRef = useRef<HTMLVideoElement>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)

    // Determine if video
    const isVideo = activeMedia && (
        activeMedia.mime?.startsWith('video/') ||
        activeMedia.filename?.match(/\.(mp4|mov|webm)$/i)
    )

    useEffect(() => {
        if (isVideo && !videoUrl && activeMedia?.storage_path) {
            fetch(`/api/signed-url?path=${encodeURIComponent(activeMedia.storage_path)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.url) setVideoUrl(data.url)
                })
                .catch(console.error)
        }
    }, [isVideo, videoUrl, activeMedia?.storage_path])

    const handleMouseEnter = () => {
        if (videoRef.current && videoUrl) {
            videoRef.current.play().catch(e => console.log('Autoplay prevented', e))
        }
    }

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    return (
        <div
            className={cn(
                "relative bg-white border-2 border-transparent hover:border-black transition-all shadow-sm rounded-lg overflow-hidden flex flex-col group",
                screen.orientation === 'portrait' ? "aspect-[9/16]" : "aspect-video",
            )}
            onMouseEnter={isVideo ? handleMouseEnter : undefined}
            onMouseLeave={isVideo ? handleMouseLeave : undefined}
        >
            <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                {screen.name}
                <span className="ml-2 opacity-75">{screen.display_type}</span>
            </div>

            <div className="flex-1 bg-gray-800 flex items-center justify-center relative">
                {activeMedia ? (
                    isVideo ? (
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
                            <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400">
                                <Loader2 className="animate-spin" />
                            </div>
                        )
                    ) : (
                        <SignedImage path={activeMedia.storage_path} alt="Screen Content" className="w-full h-full object-cover" />
                    )
                ) : (
                    <div className="text-gray-500 text-sm">No Content</div>
                )}
            </div>

            {isVideo && activeMedia && (
                <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white pointer-events-none z-10">
                    <Play size={10} fill="currentColor" />
                </div>
            )}

            <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>{screen.orientation}</span>
                <span className={cn("w-2 h-2 rounded-full", screen.last_seen_at ? "bg-green-500" : "bg-red-500")} />
            </div>

            <Link href={`/app/screens/${screen.id}`} className="absolute inset-0 z-20" aria-label={`Manage ${screen.name}`} />
        </div>
    )
}
