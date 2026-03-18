import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { token, display_type, viewport } = body

    if (!token || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

    // Token-based rate limit: max 3 requests per 60s per token (normal is 1/min)
    const limited = rateLimit('player-ping', token, { maxRequests: 3, windowMs: 60000 })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('display_screens')
        .update({
            last_seen_at: new Date().toISOString(),
        })
        .eq('player_token', token)

    if (error) {
        return NextResponse.json({ error: 'Failed to record ping' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
