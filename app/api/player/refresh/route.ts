import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const knownVersion = searchParams.get('knownVersion')
    const knownMediaId = searchParams.get('knownMediaId')

    if (!token || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

    // Token-based rate limit: max 6 requests per 60s per token
    const limited = rateLimit('player-refresh', token, { maxRequests: 6, windowMs: 60000 })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createAdminClient()

    const { data: screen } = await supabase
        .from('display_screens')
        .select('id, refresh_version')
        .eq('player_token', token)
        .single()

    if (!screen) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentVersion = screen.refresh_version
    const known = knownVersion ? parseInt(knownVersion) : -1

    let shouldRefresh = currentVersion > known

    // Smart Refresh: Check if Time-Based Content Changed
    if (!shouldRefresh) {
        const { data: resolvedMediaId } = await supabase.rpc('display_resolve_screen_media', {
            p_screen_id: screen.id,
            p_now: new Date().toISOString()
        })

        const currentId = resolvedMediaId || ''
        const clientKnownId = knownMediaId || ''

        if (currentId !== clientKnownId) {
            shouldRefresh = true
        }
    }

    return NextResponse.json({
        should_refresh: shouldRefresh,
        current_version: currentVersion
    })
}
