'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * Onesign Display — Animated Splashscreen
 *
 * Shows on first app load. Dark background, white logo,
 * gold accent line, tagline fade-in. Auto-dismisses after ~2.4s.
 *
 * Drop into app/layout.tsx as first child of <body>.
 * Requires: public/onesign-logo-white.png
 */
export default function SplashScreen() {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'gone'>('entering')

  useEffect(() => {
    // Only show splash once per browser session
    if (sessionStorage.getItem('onesign_splash_shown')) {
      setPhase('gone')
      return
    }

    sessionStorage.setItem('onesign_splash_shown', '1')

    const t1 = setTimeout(() => setPhase('visible'), 600)
    const t2 = setTimeout(() => setPhase('exiting'), 1800)
    const t3 = setTimeout(() => setPhase('gone'), 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

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
        backgroundColor: '#0a0a0a',
        pointerEvents: phase === 'exiting' ? 'none' : 'all',

        // Whole-screen fade-out
        opacity: phase === 'exiting' ? 0 : 1,
        transition: phase === 'exiting' ? 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: phase === 'entering' ? 0 : 1,
          transform: phase === 'entering' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Image
          src="/onesign-logo-white.png"
          alt="Onesign Display"
          width={180}
          height={40}
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* Gold accent line — expands from centre */}
      <div
        style={{
          marginTop: '20px',
          height: '1px',
          backgroundColor: '#4e7e8c',
          width: phase === 'entering' ? '0px' : '120px',
          transition: 'width 600ms cubic-bezier(0.4, 0, 0.6, 1) 200ms',
        }}
      />

      {/* Tagline — delayed fade-in */}
      <p
        style={{
          marginTop: '14px',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#888',
          opacity: phase === 'visible' ? 1 : 0,
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'inherit',
        }}
      >
        Your brand on every screen
      </p>
    </div>
  )
}