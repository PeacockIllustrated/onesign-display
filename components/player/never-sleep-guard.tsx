'use client'

import { useEffect, useRef, useState } from 'react'

export function NeverSleepGuard({ active }: { active: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [status, setStatus] = useState<string>('Initializing...')

    // 1. Silent Audio Heartbeat
    useEffect(() => {
        if (!active) return

        let audioCtx: AudioContext | null = null
        let oscillator: OscillatorNode | null = null

        const startAudio = () => {
            try {
                // Create context if missing
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext)
                if (!AudioContextClass) return

                audioCtx = new AudioContextClass()

                // Create a silent oscillator
                oscillator = audioCtx.createOscillator()
                const gainNode = audioCtx.createGain()

                // Extremely low gain - technically playing, physically silent
                gainNode.gain.value = 0.001

                oscillator.type = 'sine'
                oscillator.frequency.value = 1 // 1Hz - basically inaudible

                oscillator.connect(gainNode)
                gainNode.connect(audioCtx.destination)

                oscillator.start()
                console.log('[Guard] Audio heartbeat started')
            } catch (e) {
                console.warn('[Guard] Audio heartbeat failed', e)
            }
        }

        startAudio()

        // Resume audio context if the browser suspends it
        const resumeLoop = setInterval(() => {
            if (audioCtx?.state === 'suspended') {
                console.log('[Guard] Resuming suspended audio context...')
                audioCtx.resume()
            }
        }, 5000)

        return () => {
            clearInterval(resumeLoop)
            if (oscillator) {
                try { oscillator.stop() } catch (e) { }
                oscillator.disconnect()
            }
            if (audioCtx) {
                audioCtx.close()
            }
        }
    }, [active])

    // 2. Visual Heartbeat (Canvas -> Video)
    useEffect(() => {
        if (!active || !canvasRef.current || !videoRef.current) return

        const canvas = canvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext('2d')

        if (!ctx) return

        // Set dimensions
        canvas.width = 100
        canvas.height = 100

        // Animation loop to draw "noise" to the canvas
        // This ensures the frames are actually distinct, forcing the encoder/decoder to work
        let frameId: number
        let frameCount = 0

        const draw = () => {
            frameCount++
            // Draw random colored pixel in top left to force frame update
            // Using different colors ensures the compression algorithm can't just repeat the frame easily
            const r = Math.floor(Math.random() * 255)
            const g = Math.floor(Math.random() * 255)
            const b = Math.floor(Math.random() * 255)

            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(0, 0, 100, 100)

            // Add a counter text so we can visually debug if needed (even though hidden)
            ctx.fillStyle = 'white'
            ctx.fillText(frameCount.toString(), 10, 50)

            frameId = requestAnimationFrame(draw)
        }

        draw()

        // Capture stream from canvas
        // 1 FPS is enough to signal "video playing" without destroying battery (though kiosk usually plugged in)
        // But some OSs might be smart enough to detect low FPS. Let's go with 15fps to be safe but efficient.
        const stream = canvas.captureStream(15)
        video.srcObject = stream

        // Force play
        video.play().then(() => {
            setStatus('Guard Active')
            console.log('[Guard] Video heartbeat active')
        }).catch(err => {
            setStatus('Guard Failed')
            console.error('[Guard] Video play failed', err)
        })

        // 3. Self-Healing Loop
        // Monitor if the video actually progresses
        let lastTime = 0
        let stuckCount = 0

        const monitorInterval = setInterval(() => {
            if (!video) return

            const currentTime = video.currentTime
            if (currentTime === lastTime) {
                stuckCount++
                console.warn(`[Guard] Video stuck for ${stuckCount} checks`)

                if (stuckCount > 3) {
                    console.log('[Guard] Attempting restart...')
                    video.play().catch(console.warn)
                    stuckCount = 0
                }
            } else {
                stuckCount = 0
                lastTime = currentTime
            }
        }, 1000)

        return () => {
            cancelAnimationFrame(frameId)
            clearInterval(monitorInterval)
            if (video.srcObject) {
                const tracks = (video.srcObject as MediaStream).getTracks()
                tracks.forEach(track => track.stop())
            }
        }
    }, [active])

    if (!active) return null

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: 0.01,
            pointerEvents: 'none',
            zIndex: -1
        }}>
            <canvas ref={canvasRef} />
            <video
                ref={videoRef}
                playsInline
                muted
                loop
                // Important attributes for some internal browsers to allow autoplay
                autoPlay
            />
        </div>
    )
}
