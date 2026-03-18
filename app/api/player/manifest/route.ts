import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

    const limited = rateLimit('player-manifest', token, { maxRequests: 6, windowMs: 60000 })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createAdminClient()

    // 1. Find Screen by Token
    const { data: screen } = await supabase
        .from('display_screens')
        .select('id, store_id, refresh_version, store:display_stores(client_id, timezone)')
        .eq('player_token', token)
        .single()

    if (!screen) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const store = screen.store as unknown as { client_id: string; timezone: string } | null
    const clientId = store?.client_id
    const storeTimezone = store?.timezone || 'Europe/London'

    // 2. Fetch Plan & Status
    const { data: planRaw } = await supabase.from('display_client_plans').select('*').eq('client_id', clientId).single()

    const plan = planRaw || { status: 'active', video_enabled: false }

    if (plan.status === 'paused' || plan.status === 'cancelled') {
        return NextResponse.json({
            screen_id: screen.id,
            refresh_version: screen.refresh_version,
            media: { id: null, url: null, type: null },
            playlist: null,
            next_check: new Date(Date.now() + 60000).toISOString(),
            fetched_at: new Date().toISOString()
        })
    }

    // 3. Resolve Content — try new function first, fallback to legacy
    let resolvedMediaId: string | null = null
    let resolvedPlaylistId: string | null = null

    const { data: resolved } = await supabase
        .rpc('display_resolve_screen_content', {
            p_screen_id: screen.id,
            p_now: new Date().toISOString()
        })

    if (resolved && resolved.length > 0) {
        resolvedMediaId = resolved[0].resolved_media_id
        resolvedPlaylistId = resolved[0].resolved_playlist_id
    } else {
        // Fallback to legacy function if new one doesn't exist yet
        const { data: legacyMediaId } = await supabase
            .rpc('display_resolve_screen_media', {
                p_screen_id: screen.id,
                p_now: new Date().toISOString()
            })
        resolvedMediaId = legacyMediaId
    }

    // 4. Build response — playlist mode or single media mode
    let mediaResponse = { id: null as string | null, url: null as string | null, type: null as string | null }
    let playlistResponse = null

    if (resolvedPlaylistId) {
        // Playlist mode: fetch playlist settings + all items with signed URLs
        const { data: playlist } = await supabase
            .from('display_playlists')
            .select('id, transition, transition_duration_ms, loop')
            .eq('id', resolvedPlaylistId)
            .single()

        const { data: items } = await supabase
            .from('display_playlist_items')
            .select('id, media_asset_id, position, duration_seconds, media:display_media_assets(storage_path, mime)')
            .eq('playlist_id', resolvedPlaylistId)
            .order('position', { ascending: true })

        if (playlist && items && items.length > 0) {
            const signedItems = []

            for (const item of items) {
                const media = item.media as unknown as { storage_path: string; mime: string } | null
                if (!media) continue

                const isVideo = media.mime.startsWith('video/')
                if (isVideo && !plan.video_enabled) continue

                const { data: signed } = await supabase
                    .storage
                    .from('onesign-display')
                    .createSignedUrl(media.storage_path, 3600)

                signedItems.push({
                    id: item.id,
                    url: signed?.signedUrl || null,
                    type: media.mime,
                    duration_seconds: isVideo ? null : item.duration_seconds,
                })
            }

            if (signedItems.length > 0) {
                playlistResponse = {
                    id: playlist.id,
                    transition: playlist.transition,
                    transition_duration_ms: playlist.transition_duration_ms,
                    loop: playlist.loop,
                    items: signedItems,
                }
            }
        }
    } else if (resolvedMediaId) {
        // Single media mode (existing behavior)
        const { data: media } = await supabase
            .from('display_media_assets')
            .select('storage_path, mime')
            .eq('id', resolvedMediaId)
            .single()

        if (media) {
            const isVideo = media.mime.startsWith('video/')

            if (!(isVideo && !plan.video_enabled)) {
                const { data: signed } = await supabase
                    .storage
                    .from('onesign-display')
                    .createSignedUrl(media.storage_path, 3600)

                if (signed) {
                    mediaResponse = { id: resolvedMediaId, url: signed.signedUrl, type: media.mime }
                }
            }
        }
    }

    // 5. Calculate next schedule boundary
    const nowUtc = new Date()
    const localTimeStr = nowUtc.toLocaleString('en-GB', { timeZone: storeTimezone, hour12: false })
    const timePart = localTimeStr.split(', ')[1]
    const [localH, localM, localS] = timePart.split(':').map(Number)
    const currentTimeVal = localH * 3600 + localM * 60 + localS

    const localDateObj = new Date(nowUtc.toLocaleString('en-US', { timeZone: storeTimezone }))
    const currentDow = localDateObj.getDay()

    const { data: scheds } = await supabase
        .from('display_scheduled_screen_content')
        .select('schedule:display_schedules(start_time, end_time, days_of_week)')
        .eq('screen_id', screen.id)

    let nextChange: Date | null = null

    if (scheds && scheds.length > 0) {
        let minDiff = Infinity
        const toSeconds = (t: string) => {
            const [h, m, s] = t.split(':').map(Number)
            return h * 3600 + m * 60 + (s || 0)
        }

        scheds.forEach((item: any) => {
            const s = item.schedule
            if (!s || !s.days_of_week.includes(currentDow)) return
            const start = toSeconds(s.start_time)
            const end = toSeconds(s.end_time)
            if (start > currentTimeVal && start - currentTimeVal < minDiff) minDiff = start - currentTimeVal
            if (end > currentTimeVal && end - currentTimeVal < minDiff) minDiff = end - currentTimeVal
        })

        if (minDiff !== Infinity) {
            nextChange = new Date(nowUtc.getTime() + minDiff * 1000)
        }
    }

    return NextResponse.json({
        screen_id: screen.id,
        refresh_version: screen.refresh_version,
        media: mediaResponse,
        playlist: playlistResponse,
        next_check: nextChange ? nextChange.toISOString() : null,
        fetched_at: new Date().toISOString()
    })
}
