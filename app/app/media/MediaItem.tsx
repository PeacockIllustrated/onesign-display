'use client';

import { useState, useRef, useEffect } from 'react';
import { SignedImage } from '@/components/ui/signed-image';
import { Trash2, Loader2, Play } from 'lucide-react';
import { deleteMediaAsset } from './actions';

interface MediaItemProps {
    asset: {
        id: string;
        storage_path: string;
        filename: string;
        bytes?: number;
        mime?: string; // Add mime type
    };
}

export function MediaItem({ asset }: MediaItemProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const isVideo = asset.mime?.startsWith('video/') || asset.filename.match(/\.(mp4|mov|webm)$/i);

    useEffect(() => {
        if (isVideo && !videoUrl) {
            // Fetch signed URL for video
            fetch(`/api/signed-url?path=${encodeURIComponent(asset.storage_path)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.url) setVideoUrl(data.url);
                })
                .catch(console.error);
        }
    }, [isVideo, asset.storage_path, videoUrl]);

    const handleMouseEnter = () => {
        if (videoRef.current && videoUrl) {
            videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; // Reset to start
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;

        setIsDeleting(true);
        const result = await deleteMediaAsset(asset.id, asset.storage_path);

        if (!result.success) {
            alert('Failed to delete: ' + result.error);
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="group relative aspect-square bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200"
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
                    // specific poster or just first frame? loadedmetadata might show first frame
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-400">
                        <Loader2 className="animate-spin" />
                    </div>
                )
            ) : (
                <SignedImage path={asset.storage_path} alt={asset.filename} className="w-full h-full object-cover" />
            )}

            {/* Video Indicator Icon (if video) */}
            {isVideo && (
                <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white pointer-events-none z-10">
                    <Play size={10} fill="currentColor" />
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 z-20 pointer-events-none group-hover:pointer-events-auto">
                <span className="text-xs font-medium truncate max-w-[90%] px-2 text-center pointer-events-none">
                    {asset.filename}
                </span>
                <span className="text-xs text-zinc-300 pointer-events-none">
                    {Math.round((asset.bytes || 0) / 1024)} KB
                </span>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="mt-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50 pointer-events-autoCursor"
                    title="Delete"
                >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
            </div>
        </div>
    );
}
