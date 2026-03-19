import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// ── In-memory manifest cache ─────────────────────────────────
// Keyed by screen ID. Serves the same JSON response for 60 seconds,
// eliminating redundant DB queries when multiple polls hit in quick
// succession or when many screens share similar polling windows.
// Cache is automatically invalidated when refresh_version changes.
const manifestCache = new Map<string, { data: any; version: number; expiresAt: number }>()
const CACHE_TTL_MS = 60_000 // 60 seconds

function getCachedManifest(screenId: string, currentVersion: number): any | null {
    const entry = manifestCache.get(screenId)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) { manifestCache.delete(screenId); return null }
    if (entry.version !== currentVersion) { manifestCache.delete(screenId); return null }
    return entry.data
}

function setCachedManifest(screenId: string, version: number, data: any): void {
    // Prevent unbounded growth — evict oldest entries if cache is too large
    if (manifestCache.size > 10_000) {
        const oldest = manifestCache.keys().next().value
        if (oldest) manifestCache.delete(oldest)
    }
    manifestCache.set(screenId, { data, version, expiresAt: Date.now() + CACHE_TTL_MS })
}

const SIGN_TTL_BASE = 86400 // 24 hours — longer TTL lets browsers cache media all day,
                             // cutting egress by ~97%. Content changes still arrive instantly
                             // via the refresh_version mechanism.
const SIGN_TTL_STAGGER = 300 // stagger per item (5 min) so URLs don't all expire at once
const MAX_SIGN_RETRIES = 2

async function signUrlWithRetry(
    supabase: any,
    storagePath: string,
    ttl: number
): Promise<string | null> {
    for (let attempt = 0; attempt <= MAX_SIGN_RETRIES; attempt++) {
        const { data: signed, error } = await supabase
            .storage
            .from('onesign-display')
            .createSignedUrl(storagePath, ttl)

        if (signed?.signedUrl) return signed.signedUrl

        console.error(
            `[Manifest] createSignedUrl failed for "${storagePath}" ` +
            `(attempt ${attempt + 1}/${MAX_SIGN_RETRIES + 1}):`,
            error?.message || 'unknown error'
        )

        if (attempt < MAX_SIGN_RETRIES) {
            await new Promise(r => setTimeout(r, 50 * (attempt + 1)))
        }
    }
    return null
}

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

    // 1. Find Screen by Token (includes fit_mode + screen set sync data)
    const { data: screen } = await supabase
        .from('display_screens')
        .select('id, store_id, refresh_version, fit_mode, screen_set_id, index_in_set, store:display_stores(client_id, timezone), screen_set:display_screen_sets(id, sync_enabled, sync_epoch)')
        .eq('player_token', token)
        .single()

    if (!screen) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // ── Cache check: return cached manifest if still valid ──
    // The token lookup above is unavoidable (we need screen.id), but it's a
    // single indexed query. Everything below this point is the expensive part
    // (content resolution, playlist joins, URL signing) — cache skips all of it.
    const cached = getCachedManifest(screen.id, screen.refresh_version)
    if (cached) {
        return NextResponse.json(cached)
    }

    const fitMode = screen.fit_mode || 'contain'
    const store = screen.store as unknown as { client_id: string; timezone: string } | null
    const clientId = store?.client_id
    const storeTimezone = store?.timezone || 'Europe/London'
    const screenSet = screen.screen_set as unknown as { id: string; sync_enabled: boolean; sync_epoch: string | null } | null
    const isSynced = screenSet?.sync_enabled === true

    // 2. Fetch Plan & Status
    const { data: planRaw } = await supabase.from('display_client_plans').select('*').eq('client_id', clientId).single()

    const plan = planRaw || { status: 'active', video_enabled: false }

    if (plan.status === 'paused' || plan.status === 'cancelled') {
        return NextResponse.json({
            screen_id: screen.id,
            refresh_version: screen.refresh_version,
            fit_mode: fitMode,
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
            let itemIndex = 0

            for (const item of items) {
                const media = item.media as unknown as { storage_path: string; mime: string } | null
                if (!media) continue

                const isVideo = media.mime.startsWith('video/')
                if (isVideo && !plan.video_enabled) continue

                const itemTtl = SIGN_TTL_BASE + (itemIndex * SIGN_TTL_STAGGER)
                const signedUrl = await signUrlWithRetry(supabase, media.storage_path, itemTtl)

                // Drop items with failed URLs entirely — no black frames
                if (!signedUrl) {
                    console.error(`[Manifest] Dropping playlist item ${item.id} — URL signing failed permanently`)
                    continue
                }

                signedItems.push({
                    id: item.id,
                    url: signedUrl,
                    type: media.mime,
                    // Sync mode requires duration_seconds for ALL items (including videos)
                    // so the deterministic position calculator can build a timeline
                    duration_seconds: (isVideo && !isSynced) ? null : item.duration_seconds,
                })
                itemIndex++
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
                const signedUrl = await signUrlWithRetry(supabase, media.storage_path, SIGN_TTL_BASE)

                if (signedUrl) {
                    mediaResponse = { id: resolvedMediaId, url: signedUrl, type: media.mime }
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

    // 6. Build sync data if screen is in a synced screen set
    let syncResponse = null

    if (isSynced && screen.screen_set_id) {
        // Lazy-init epoch: if sync is enabled but epoch not yet set, set it now
        let epoch = screenSet!.sync_epoch
        if (!epoch) {
            const newEpoch = new Date().toISOString()
            await supabase
                .from('display_screen_sets')
                .update({ sync_epoch: newEpoch })
                .eq('id', screen.screen_set_id)
            epoch = newEpoch
        }

        // Count screens in the set for the sync config
        const { count: screenCount } = await supabase
            .from('display_screens')
            .select('id', { count: 'exact', head: true })
            .eq('screen_set_id', screen.screen_set_id)

        syncResponse = {
            enabled: true,
            epoch,
            screen_index: screen.index_in_set ?? 0,
            screen_count: screenCount ?? 1,
        }
    }

    const responseData = {
        screen_id: screen.id,
        refresh_version: screen.refresh_version,
        fit_mode: fitMode,
        media: mediaResponse,
        playlist: playlistResponse,
        sync: syncResponse,
        next_check: nextChange ? nextChange.toISOString() : null,
        fetched_at: new Date().toISOString()
    }

    // Cache the full response — subsequent requests within 60s skip all
    // DB queries except the initial token lookup (which is needed for
    // cache key + version check anyway).
    setCachedManifest(screen.id, screen.refresh_version, responseData)

    return NextResponse.json(responseData)
}
