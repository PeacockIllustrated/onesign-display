import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Clock calibration endpoint for multi-screen sync.
 *
 * Returns the server's current time in milliseconds.
 * The player calls this 5 times on mount, measures RTT for each,
 * and computes the median clock offset to synchronize with the server.
 *
 * No database call — must be as fast as possible to minimise RTT noise.
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')

    // Rate limit: 30 req/60s per token (5 calibration + recalibration every 5 min)
    if (token) {
        const limited = rateLimit('player-clock', token, { maxRequests: 30, windowMs: 60000 })
        if (limited) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }
    }

    return NextResponse.json(
        { server_time: Date.now() },
        {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
            },
        }
    )
}
