'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ScreensLockup } from '@/components/brand/ScreensLockup'
import { formatPairingCode } from '@/lib/player/pairing'

// Shared with the LG app and Fully Kiosk setups; do not rename.
const TOKEN_KEY = 'onesign_player_token'
const SECRET_KEY = 'onesign_pair_secret'
const POLL_MS = 4000

type Phase = 'starting' | 'showing' | 'paired' | 'error'

function deviceSecret(): string {
    try {
        const existing = localStorage.getItem(SECRET_KEY)
        if (existing && existing.length >= 16) return existing
    } catch {}
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    const secret = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    try { localStorage.setItem(SECRET_KEY, secret) } catch {}
    return secret
}

/**
 * /pair: the page a TV opens to get set up. It shows a short code; someone
 * types that code into the portal on the screen's page, and this page picks
 * up the player token and moves on to the player by itself.
 */
export default function PairPage() {
    const [phase, setPhase] = useState<Phase>('starting')
    const [code, setCode] = useState<string | null>(null)
    const secretRef = useRef<string>('')

    const requestCode = useCallback(async () => {
        setPhase('starting')
        try {
            const res = await fetch('/api/player/pair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_secret: secretRef.current }),
            })
            if (!res.ok) throw new Error(String(res.status))
            const data = await res.json()
            setCode(data.code)
            setPhase('showing')
        } catch {
            setPhase('error')
            setTimeout(() => requestCode(), 10_000)
        }
    }, [])

    // Already paired on this device? Go straight to the player, unless ?new is set.
    useEffect(() => {
        secretRef.current = deviceSecret()
        const fresh = new URLSearchParams(location.search).has('new')
        let stored: string | null = null
        try { stored = localStorage.getItem(TOKEN_KEY) } catch {}
        if (stored && !fresh) {
            location.replace(`/player/${encodeURIComponent(stored)}`)
            return
        }
        requestCode()
    }, [requestCode])

    // Poll until the code is claimed in the portal, or expires.
    useEffect(() => {
        if (phase !== 'showing' || !code) return
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`/api/player/pair?code=${code}&device_secret=${secretRef.current}`, { cache: 'no-store' })
                const data = await res.json().catch(() => null)
                if (data?.status === 'paired' && data.token) {
                    clearInterval(timer)
                    setPhase('paired')
                    try { localStorage.setItem(TOKEN_KEY, data.token) } catch {}
                    setTimeout(() => location.replace(`/player/${encodeURIComponent(data.token)}`), 1500)
                } else if (data?.status === 'expired' || data?.status === 'unknown') {
                    clearInterval(timer)
                    requestCode()
                }
            } catch {
                // Offline for a moment; keep polling.
            }
        }, POLL_MS)
        return () => clearInterval(timer)
    }, [phase, code, requestCode])

    return (
        <main className="fixed inset-0 bg-od-night text-od-paper flex flex-col items-center justify-center gap-[4vh] px-8 text-center cursor-none select-none">
            <ScreensLockup reversed style={{ width: 'min(420px, 40vw)', height: 'auto' }} />

            {phase === 'paired' ? (
                <p className="text-[4vh] font-bold">Paired. Starting your screen…</p>
            ) : phase === 'showing' && code ? (
                <>
                    <p className="font-mono uppercase tracking-[0.08em] text-[1.8vh] text-od-paper/60">pairing code</p>
                    <p className="font-bold leading-none tracking-[0.06em] text-[16vh]" aria-live="polite">
                        {formatPairingCode(code)}
                    </p>
                    <p className="max-w-[60ch] text-[2.6vh] text-od-paper/80">
                        In the Onedesign Screens portal, open the screen and choose <strong>Pair a TV</strong>, then type this code.
                        This page moves on by itself once it’s paired.
                    </p>
                </>
            ) : phase === 'error' ? (
                <p className="text-[3vh] text-od-paper/80">Waiting for the internet. Trying again shortly…</p>
            ) : (
                <p className="text-[3vh] text-od-paper/60">Getting a code…</p>
            )}
        </main>
    )
}
