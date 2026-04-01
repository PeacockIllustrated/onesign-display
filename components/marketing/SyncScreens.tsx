'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const SLIDES = [
    '/marketing/hero-display-warm.jpeg',
    '/marketing/hero-gold.png',
    '/marketing/hero-neon.jpeg',
]

const INTERVAL = 4000
const WIPE_DURATIONS = [1000, 700, 1000]
const STAGGERS = [0, 1000, 1700]

export function SyncScreens() {
    const [current, setCurrent] = useState(0)
    const [next, setNext] = useState(0)
    const [wiping, setWiping] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => {
            setNext((prev) => (prev + 1) % SLIDES.length)
            setWiping(true)

            setTimeout(() => {
                setCurrent((prev) => (prev + 1) % SLIDES.length)
                setWiping(false)
            }, WIPE_DURATIONS[2] + STAGGERS[2] + 100)
        }, INTERVAL + WIPE_DURATIONS[2] + STAGGERS[2])

        return () => clearInterval(timer)
    }, [])

    return (
        <>
            <style>{`
                @keyframes syncWipe0 {
                    from { clip-path: inset(0 100% 0 0); }
                    to { clip-path: inset(0 0 0 0); }
                }
                @keyframes syncWipe1 {
                    from { clip-path: inset(0 100% 0 0); }
                    to { clip-path: inset(0 0 0 0); }
                }
                @keyframes syncWipe2 {
                    from { clip-path: inset(0 100% 0 0); }
                    to { clip-path: inset(0 0 0 0); }
                }
            `}</style>
            <div className="flex items-center justify-center gap-4 md:gap-6">
                {[0, 1, 2].map((n) => (
                    <div key={n} className="w-44 md:w-56 lg:w-64 aspect-video bg-neutral-900 rounded-lg relative overflow-hidden shadow-xl">
                        <Image
                            src={SLIDES[current]}
                            alt={`Screen ${n + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 176px, (max-width: 1024px) 224px, 256px"
                            priority
                        />
                        {wiping && (
                            <Image
                                src={SLIDES[next]}
                                alt={`Screen ${n + 1} next`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 176px, (max-width: 1024px) 224px, 256px"
                                style={{
                                    animation: `syncWipe${n} ${WIPE_DURATIONS[n]}ms ${n === 0 ? 'cubic-bezier(0.4, 0, 1, 1)' : n === 1 ? 'linear' : 'cubic-bezier(0, 0, 0.6, 1)'} ${STAGGERS[n]}ms both`,
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </>
    )
}
