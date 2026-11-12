'use client'

import { useEffect, useState } from 'react'
import { ScreensLockup } from './ScreensLockup'

const NIGHT = '#161b1f'
const PAPER = '#f3efe6'

/**
 * Full-screen Onedesign Screens intro: the 1-mark pops in, "screens" lands
 * letter by letter, then the whole thing fades away.
 */
export function BrandSplash({ holdMs = 2200, tagline = 'Menus on every screen' }: { holdMs?: number; tagline?: string }) {
  const [phase, setPhase] = useState<'in' | 'exiting' | 'gone'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exiting'), holdMs)
    const t2 = setTimeout(() => setPhase('gone'), holdMs + 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [holdMs])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: NIGHT,
        pointerEvents: phase === 'exiting' ? 'none' : 'all',
        opacity: phase === 'exiting' ? 0 : 1,
        transition: 'opacity 600ms cubic-bezier(0.37, 0, 0.63, 1)',
      }}
    >
      <style>{`@keyframes brandSplashTag { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }`}</style>
      <ScreensLockup reversed animate style={{ width: 'min(320px, 70vw)', height: 'auto' }} />
      <p
        style={{
          marginTop: 28,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: PAPER,
          opacity: 0.6,
          animation: 'brandSplashTag 420ms 1200ms both',
        }}
      >
        {tagline}
      </p>
    </div>
  )
}
