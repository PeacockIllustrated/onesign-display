import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          borderRadius: '40px',
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width="120"
          height="120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="16" cy="16" r="16" fill="#1a1a1a" />
          <path d="M18.5 6 L10 13.5 L14 13.5 L14 26 L20.5 26 L20.5 6 Z" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
