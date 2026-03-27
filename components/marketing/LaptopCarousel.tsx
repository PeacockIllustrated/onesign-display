'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Slide {
    src: string
    alt: string
}

interface LaptopCarouselProps {
    slides: Slide[]
    interval?: number
    className?: string
}

export function LaptopCarousel({ slides, interval = 4000, className = '' }: LaptopCarouselProps) {
    const [current, setCurrent] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const advance = useCallback(() => {
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
            setIsTransitioning(false)
        }, 500) // match CSS transition duration
    }, [slides.length])

    useEffect(() => {
        if (slides.length <= 1) return
        const timer = setInterval(advance, interval)
        return () => clearInterval(timer)
    }, [advance, interval, slides.length])

    return (
        <div className={`relative ${className}`}>
            {/* ── SVG Laptop Frame ── */}
            <svg
                viewBox="0 0 1200 720"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto relative z-10"
            >
                {/* Laptop lid / screen bezel */}
                <rect x="120" y="0" width="960" height="640" rx="16" fill="#1a1a1a" />

                {/* Inner screen border */}
                <rect x="140" y="16" width="920" height="604" rx="8" fill="#000" />

                {/* Screen area — foreignObject for HTML content */}
                <foreignObject x="140" y="16" width="920" height="604" clipPath="url(#screenClip)">
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '8px',
                        }}
                    >
                        {slides.map((slide, i) => (
                            <div
                                key={slide.src}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: i === current && !isTransitioning ? 1 : 0,
                                    transition: 'opacity 500ms ease-in-out',
                                }}
                            >
                                <Image
                                    src={slide.src}
                                    alt={slide.alt}
                                    fill
                                    className="object-cover object-top"
                                    sizes="(max-width: 768px) 90vw, 60vw"
                                    priority={i === 0}
                                />
                            </div>
                        ))}
                    </div>
                </foreignObject>

                {/* Webcam dot */}
                <circle cx="600" cy="8" r="3" fill="#333" />

                {/* Laptop base / keyboard deck — matches screen lid width */}
                <path
                    d="M120 644 H1080 L1084 660 C1086 670 1082 680 1080 686 H120 C118 680 114 670 116 660 Z"
                    fill="#2a2a2a"
                />

                {/* Base top edge highlight */}
                <line x1="120" y1="644" x2="1080" y2="644" stroke="#404040" strokeWidth="1.5" />

                {/* Trackpad */}
                <rect x="510" y="652" width="180" height="24" rx="4" fill="#333" stroke="#404040" strokeWidth="0.5" />

                {/* Hinge shadow */}
                <ellipse cx="600" cy="648" rx="200" ry="2" fill="rgba(0,0,0,0.12)" />

                {/* Bottom shadow under laptop */}
                <ellipse cx="600" cy="700" rx="460" ry="8" fill="rgba(0,0,0,0.06)" />

                {/* Clip definition */}
                <defs>
                    <clipPath id="screenClip">
                        <rect x="140" y="16" width="920" height="604" rx="8" />
                    </clipPath>
                </defs>
            </svg>

            {/* ── Slide indicators ── */}
            {slides.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setIsTransitioning(true)
                                setTimeout(() => {
                                    setCurrent(i)
                                    setIsTransitioning(false)
                                }, 300)
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === current
                                    ? 'w-6 bg-[#4e7e8c]'
                                    : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
