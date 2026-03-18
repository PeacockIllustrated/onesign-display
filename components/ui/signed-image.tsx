'use client'

import { useEffect, useState } from 'react'

export function SignedImage({ path, alt, className, mime }: { path: string, alt: string, className?: string, mime?: string }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!path) return

        fetch(`/api/signed-url?path=${encodeURIComponent(path)}`)
            .then(res => res.json())
            .then(data => {
                if (data.url) setUrl(data.url)
            })
            .catch(console.error)
    }, [path])

    if (!url) return <div className={`bg-gray-200 animate-pulse ${className}`} />

    // Detect video by MIME type or file extension fallback
    const isVideo = mime?.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(path)

    if (isVideo) {
        return (
            <video
                src={url}
                className={className}
                autoPlay
                muted
                playsInline
                loop
            />
        )
    }

    return <img src={url} alt={alt} className={className} />
}
