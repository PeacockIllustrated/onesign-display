import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const knownVersion = searchParams.get('knownVersion')
    const knownMediaId = searchParams.get('knownMediaId')
    const knownPlaylistId = searchParams.get('knownPlaylistId')

    if (!token || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

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

    // Smart Refresh: Check if time-based content changed
    if (!shouldRefresh) {
        // Try new resolution function first
        const { data: resolved } = await supabase
            .rpc('display_resolve_screen_content', {
                p_screen_id: screen.id,
                p_now: new Date().toISOString()
            })

        if (resolved && resolved.length > 0) {
            const currentMediaId = resolved[0].resolved_media_id || ''
            const currentPlaylistId = resolved[0].resolved_playlist_id || ''

            if (currentMediaId !== (knownMediaId || '')) shouldRefresh = true
            if (currentPlaylistId !== (knownPlaylistId || '')) shouldRefresh = true
        } else {
            // Fallback to legacy function
            const { data: resolvedMediaId } = await supabase.rpc('display_resolve_screen_media', {
                p_screen_id: screen.id,
                p_now: new Date().toISOString()
            })

            const currentId = resolvedMediaId || ''
            const clientKnownId = knownMediaId || ''

            if (currentId !== clientKnownId) shouldRefresh = true
        }
    }

    return NextResponse.json({
        should_refresh: shouldRefresh,
        current_version: currentVersion
    })
}
