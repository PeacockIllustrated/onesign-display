'use client'

import { useEffect, useRef } from 'react'

export function NeverSleepGuard({ active }: { active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // 1. Silent Audio Heartbeat — primary anti-sleep mechanism
    useEffect(() => {
        if (!active) return

        let audioCtx: AudioContext | null = null
        let oscillator: OscillatorNode | null = null

        const startAudio = () => {
            try {
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext)
                if (!AudioContextClass) return

                audioCtx = new AudioContextClass()

                oscillator = audioCtx.createOscillator()
                const gainNode = audioCtx.createGain()

                gainNode.gain.value = 0.001
                oscillator.type = 'sine'
                oscillator.frequency.value = 1

                oscillator.connect(gainNode)
                gainNode.connect(audioCtx.destination)

                oscillator.start()
                console.log('[Guard] Audio heartbeat started')
            } catch (e) {
                console.warn('[Guard] Audio heartbeat failed', e)
            }
        }

        startAudio()

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

    // 2. Visual Heartbeat — canvas-only, no video element, no decoder slot consumed
    useEffect(() => {
        if (!active || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = 2
        canvas.height = 2

        let frameId: number
        let frameCount = 0

        const draw = () => {
            frameCount++
            const v = frameCount % 2 === 0 ? 255 : 0
            ctx.fillStyle = `rgb(${v},${v},${v})`
            ctx.fillRect(0, 0, 2, 2)
            frameId = requestAnimationFrame(draw)
        }

        draw()

        return () => {
            cancelAnimationFrame(frameId)
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
        </div>
    )
}
