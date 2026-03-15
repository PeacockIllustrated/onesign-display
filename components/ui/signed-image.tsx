'use client'

import { useEffect, useState } from 'react'

export function SignedImage({ path, alt, className }: { path: string, alt: string, className?: string }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!path) return

        // Fetch signed URL from new API route
        fetch(`/api/signed-url?path=${encodeURIComponent(path)}`)
            .then(res => res.json())
            .then(data => {
                if (data.url) setUrl(data.url)
            })
            .catch(console.error)
    }, [path])

    if (!url) return <div className={`bg-gray-200 animate-pulse ${className}`} />

    return <img src={url} alt={alt} className={className} />
}
