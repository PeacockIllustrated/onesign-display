'use client'

import { useEffect, useRef } from 'react'

export function NeverSleepGuard({ active }: { active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

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

    // 3. Media Session API — declares "playing" at OS API level (separate
    //    signal pathway from Web Audio output; some TV OSes monitor this
    //    independently of whether audio is actually flowing). Also pushes
    //    a fake position update every 10s to maintain "actively progressing
    //    playback" — a stronger signal than a static playing state.
    useEffect(() => {
        if (!active) return
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Onesign Display',
                artist: 'Onesign & Digital',
                album: 'Live Signage',
            })
            navigator.mediaSession.playbackState = 'playing'
            const noop = () => {}
            navigator.mediaSession.setActionHandler('play', noop)
            navigator.mediaSession.setActionHandler('pause', noop)
        } catch (e) {
            console.warn('[Guard] Media Session unavailable', e)
        }

        // Position-state heartbeat. Some firmware power managers wake from
        // dimming only when playback position is actively advancing, not just
        // when state="playing". We send a fake monotonically-increasing
        // position so the TV sees continuous media progress.
        const start = Date.now()
        const positionTimer = setInterval(() => {
            try {
                const elapsed = (Date.now() - start) / 1000
                if (typeof navigator.mediaSession.setPositionState === 'function') {
                    navigator.mediaSession.setPositionState({
                        duration: Number.POSITIVE_INFINITY,
                        playbackRate: 1.0,
                        position: elapsed,
                    })
                }
            } catch {}
        }, 10_000)

        return () => {
            clearInterval(positionTimer)
            try {
                navigator.mediaSession.playbackState = 'none'
                navigator.mediaSession.metadata = null
            } catch {}
        }
    }, [active])

    // 4. Hidden looping <video> — distinct HTMLMediaElement signal that hits
    //    the OS media pipeline (different code path from Web Audio oscillator).
    useEffect(() => {
        if (!active || !videoRef.current) return
        videoRef.current.play().catch(() => {})
    }, [active])

    // 5. Hidden looping <audio> — exercises the AUDIO decoder pipeline,
    //    which on most webOS firmware is tracked separately from both the
    //    video decoder and Web Audio synthesis. Volume kept at 0.001 so no
    //    speaker pops/buzz, but the decoder treats it as active playback.
    //    Periodically nudges currentTime to defeat any "stuck stream"
    //    timer the firmware might run.
    useEffect(() => {
        if (!active || !audioRef.current) return
        const el = audioRef.current
        el.volume = 0.001
        el.play().catch(() => {})
        const nudge = setInterval(() => {
            // If playback halts (some TV browsers pause inaudible media after
            // long sessions to save battery), force a resume.
            if (el.paused) el.play().catch(() => {})
        }, 30_000)
        return () => clearInterval(nudge)
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
                src="/silent.mp4"
                muted
                playsInline
                loop
                preload="auto"
            />
            <audio
                ref={audioRef}
                src="/silent.mp3"
                loop
                preload="auto"
            />
        </div>
    )
}
