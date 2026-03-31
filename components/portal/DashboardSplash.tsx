'use client'

import { useEffect, useState } from 'react'

const DISPLAY_LETTERS = [
  'M479.84,162.57c0,6.53-1.69,11.12-5.08,14.27l-31.68,29.26c-5.8,5.32-12.58,7.98-20.56,7.98h-70.38c-7.98,0-12.09-4.11-12.09-12.09V54.47c0-6.53,3.14-9.67,9.67-9.67h97.47c21.77,0,32.65,10.4,32.65,31.2v86.58ZM388.66,77.93c-2.42,0-3.63,1.21-3.63,3.39v95.29c0,2.9,1.21,4.35,3.63,4.35h19.11c3.14,0,6.05-1.45,8.22-4.11l5.8-7.26c1.69-2.18,2.42-5.08,2.42-8.22v-71.35c0-7.98-4.6-12.09-13.54-12.09h-22.01Z',
  'M558.93,204.42c0,6.53-3.14,9.67-9.67,9.67h-46.44c-6.53,0-9.67-3.14-9.67-9.67v-60.22c0-3.63.97-6.77,2.66-9.43l13.3-19.83c1.93-2.9,2.9-6.29,2.9-9.92v-50.55c0-6.53,3.14-9.67,9.67-9.67h27.57c6.53,0,9.67,3.14,9.67,9.67v149.95Z',
  'M701.38,72.12c0,3.87-1.94,5.8-5.56,5.8h-60.22c-3.63,0-5.56,1.93-5.56,6.05v13.54c0,4.59,1.93,6.05,5.56,6.53l48.61,7.74c13.3,2.18,19.83,11.13,19.83,26.85v33.13c0,28.3-12.58,42.32-37.73,42.32h-42.81c-6.05,0-12.58-.97-19.35-2.18l-21.77-3.87c-3.63-.73-4.84-3.63-4.84-7.5v-13.79c0-3.87,1.69-5.8,5.08-5.8h63.37c3.63,0,5.56-1.93,5.56-6.05v-14.51c0-4.11-1.93-6.53-5.56-7.25l-45.95-10.16c-16.69-3.63-22.01-10.88-22.01-26.36v-40.15c0-21.04,10.4-31.68,31.44-31.68h86.34c3.63,0,5.56,1.69,5.56,5.32v22.01Z',
  'M859.55,109.37c0,6.53-1.69,11.12-5.08,14.27l-31.68,29.26c-4.59,4.11-10.16,7.98-16.69,7.98h-28.54c-1.69,0-2.42.97-2.42,2.66v40.87c0,6.53-3.14,9.67-9.67,9.67h-33.62c-6.53,0-9.67-3.14-9.67-9.67V54.71c0-6.53,3.14-9.92,9.67-9.92h95.05c25.15,0,32.65,4.11,32.65,31.2v33.38ZM778.04,75.02c-1.93,0-2.9,1.21-2.9,3.39v49.34c0,1.93.97,2.9,2.9,2.9h19.11c3.39,0,6.05-1.45,8.22-4.11l5.8-7.25c1.69-2.42,2.42-5.08,2.42-8.22v-23.94c0-7.98-4.59-12.09-13.54-12.09h-22.01Z',
  'M930.65,174.91c0,4.11,1.93,6.05,6.05,6.05h38.94c3.63,0,5.32,1.93,5.32,5.8v19.83c0,3.87-1.69,6.29-5.08,7.5h-66.75c-22.49,0-33.86-11.12-33.86-33.62V54.47c0-6.53,3.14-9.67,9.67-9.67h36.04c6.53,0,9.67,3.14,9.67,9.67v120.44Z',
  'M1134.05,204.42c0,6.53-3.14,9.67-9.67,9.67h-25.64c-6.53,0-9.67-3.14-9.67-9.67v-44.02c0-2.18-1.21-3.39-3.39-3.39h-28.54c-2.18,0-3.14.97-3.14,3.14v44.26c0,6.53-3.14,9.67-9.67,9.67h-46.44c-6.53,0-9.67-3.14-9.67-9.67v-50.55c0-3.63.97-6.77,2.66-9.43l13.3-19.83c1.93-2.9,2.9-6.29,2.9-9.92v-13.54c0-5.08,1.69-9.92,5.08-14.27l23.46-31.68c5.08-7.01,12.09-10.4,20.8-10.4h60.71c11.37,0,16.93,5.56,16.93,16.93v142.69ZM1069.23,77.93c-2.9,0-5.32,1.45-7.01,4.11l-6.05,9.67c-1.45,2.18-2.18,4.59-2.18,7.01v25.88c0,2.18.97,3.14,2.9,3.14h28.78c2.18,0,3.39-.97,3.39-3.14v-40.15c0-4.35-1.93-6.53-5.56-6.53h-14.27Z',
  'M1286.9,140.32c0,12.82-6.53,19.35-19.35,19.35h-15.96c-2.66,0-3.87,1.21-3.87,3.63v41.12c0,6.53-3.14,9.67-9.67,9.67h-33.62c-6.53,0-9.67-3.14-9.67-9.67v-41.12c0-2.42-1.21-3.63-3.63-3.63h-22.01c-12.82,0-19.35-6.53-19.35-19.35V54.47c0-6.53,3.14-9.67,9.67-9.67h36.04c6.53,0,9.67,3.14,9.67,9.67v70.62c0,4.84,2.42,7.25,7.01,7.25h24.43c4.11,0,6.05-2.42,6.05-7.25V54.47c0-6.53,3.14-9.67,9.67-9.67h24.91c6.53,0,9.67,3.14,9.67,9.67v85.86Z',
]

export function DashboardSplash() {
  const [phase, setPhase] = useState<'drawing' | 'text' | 'visible' | 'exiting' | 'gone'>('drawing')

  useEffect(() => {
    // Show every refresh while testing
    const t1 = setTimeout(() => setPhase('text'), 1400)
    const t2 = setTimeout(() => setPhase('visible'), 2600)
    const t3 = setTimeout(() => setPhase('exiting'), 3200)
    const t4 = setTimeout(() => setPhase('gone'), 3800)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  if (phase === 'gone') return null

  const iconDone = phase !== 'drawing'
  const textDone = phase === 'visible' || phase === 'exiting'

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
        opacity: phase === 'exiting' ? 0 : 1,
        transition: phase === 'exiting' ? 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      <style>{`
        @keyframes dashDrawPath {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes dashGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(149,218,248,0.5)) drop-shadow(0 0 18px rgba(36,84,91,0.7)); }
          50% { filter: drop-shadow(0 0 14px rgba(149,218,248,0.85)) drop-shadow(0 0 36px rgba(36,84,91,0.95)); }
        }
      `}</style>

      {/* Animated Icon */}
      <div
        style={{
          animation: iconDone ? 'dashGlowPulse 2.5s ease-in-out infinite' : 'none',
          filter: 'drop-shadow(0 0 8px rgba(149,218,248,0.4)) drop-shadow(0 0 22px rgba(36,84,91,0.6))',
          position: 'relative',
          width: 100,
          height: 90,
        }}
      >
        <svg
          viewBox="0 0 292.79 264.11"
          style={{ width: 100, height: 'auto', position: 'absolute', inset: 0 }}
        >
          <defs>
            <filter id="dash-icon-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#95daf8" floodOpacity="0.7" />
              <feComposite in2="blur" operator="in" />
              <feComposite in="SourceGraphic" />
            </filter>
          </defs>
          <path
            d="M251.54,227.11c25.61-23.24,38.42-54.89,38.42-94.93s-12.77-71.62-38.33-94.71C226.09,14.38,191.09,2.83,146.6,2.83S66.86,14.36,41.25,37.48C15.64,60.57,2.83,92.14,2.83,132.18s12.88,71.69,38.62,94.93c22.1,19.93,51.03,31.31,86.84,34.14,3.98.31,7.4-2.79,7.4-6.78v-93.78c0-3.76-3.05-6.8-6.8-6.8H61.96c-3.76,0-6.8-3.05-6.8-6.8v-39.44c0-3.76,3.05-6.8,6.8-6.8h0c24.97,0,43.96-4.2,56.95-12.62,11.77-7.62,19.79-19.43,24.05-35.43.79-2.96,3.49-5.01,6.56-5.01h51.04c3.76,0,6.8,3.05,6.8,6.8v188.34c0,4.88,5,8.18,9.49,6.26,13.03-5.56,24.59-12.9,34.69-22.07"
            fill="none"
            stroke="#95daf8"
            strokeWidth="5.67"
            strokeMiterlimit="10"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            filter="url(#dash-icon-glow)"
            style={{
              animation: 'dashDrawPath 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          />
          <path
            d="M248.7,224.28c25.61-23.24,38.42-54.89,38.42-94.93s-12.77-71.62-38.33-94.71C223.26,11.55,188.25,0,143.76,0S64.03,11.53,38.42,34.64C12.81,57.73,0,89.31,0,129.35s12.88,71.69,38.62,94.93c23.6,21.29,55,32.82,94.24,34.6v-107.83H52.32v-53.05h6.8c24.97,0,43.96-4.2,56.95-12.62,12.97-8.39,21.38-21.87,25.23-40.44h63.22v205.05c16.96-5.84,31.69-14.37,44.18-25.72"
            fill="white"
            style={{
              opacity: iconDone ? 1 : 0,
              transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
      </div>

      {/* Onesign logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/Onesign-White.svg"
        alt="Onesign"
        style={{
          marginTop: 22,
          height: 50,
          width: 'auto',
          objectFit: 'contain',
          opacity: iconDone ? 1 : 0,
          transform: iconDone ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1) 100ms, transform 400ms cubic-bezier(0.4, 0, 0.2, 1) 100ms',
        }}
      />

      {/* "DISPLAY" animated SVG letter paths */}
      <div
        style={{
          marginTop: 4,
          filter: iconDone ? 'drop-shadow(0 0 5px rgba(149,218,248,0.4)) drop-shadow(0 0 14px rgba(36,84,91,0.5))' : 'none',
          transition: 'filter 600ms ease',
        }}
      >
        <svg
          viewBox="330 30 970 200"
          style={{ width: 240, height: 'auto' }}
        >
          <defs>
            <filter id="dash-text-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feFlood floodColor="#95daf8" floodOpacity="0.6" />
              <feComposite in2="blur" operator="in" />
              <feComposite in="SourceGraphic" />
            </filter>
          </defs>
          {DISPLAY_LETTERS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#95daf8"
              strokeWidth="5.67"
              strokeMiterlimit="10"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={iconDone ? undefined : 1}
              filter="url(#dash-text-glow)"
              style={iconDone ? {
                animation: `dashDrawPath 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s both`,
              } : {
                strokeDashoffset: 1,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Accent line */}
      <div
        style={{
          marginTop: 14,
          height: '1px',
          backgroundColor: '#4e7e8c',
          width: textDone ? '80px' : '0px',
          transition: 'width 400ms cubic-bezier(0.4, 0, 0.6, 1)',
        }}
      />

      {/* Tagline */}
      <p
        style={{
          marginTop: 10,
          fontSize: '10px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#666',
          opacity: textDone ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'inherit',
        }}
      >
        Dashboard
      </p>
    </div>
  )
}
