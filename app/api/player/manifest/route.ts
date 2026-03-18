import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token || token.length > 255) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 400 })
    }

    // Token-based rate limit: max 6 requests per 60s per token (normal is ~2/min)
    const limited = rateLimit('player-manifest', token, { maxRequests: 6, windowMs: 60000 })
    if (limited) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createAdminClient()

    // 1. Find Screen by Token (include store timezone)
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

    const plan = planRaw || {
        status: 'active',
        video_enabled: false
    }

    if (plan.status === 'paused' || plan.status === 'cancelled') {
        return NextResponse.json({
            screen_id: screen.id,
            refresh_version: screen.refresh_version,
            media: { id: null, url: null, type: null },
            next_check: new Date(Date.now() + 60000).toISOString(),
            fetched_at: new Date().toISOString()
        })
    }

    // 3. Resolve Content via SQL (timezone-aware)
    const { data: mediaId } = await supabase
        .rpc('display_resolve_screen_media', {
            p_screen_id: screen.id,
            p_now: new Date().toISOString()
        })

    let mediaUrl = null
    let mimeType = null

    if (mediaId) {
        const { data: media } = await supabase
            .from('display_media_assets')
            .select('storage_path, mime')
            .eq('id', mediaId)
            .single()

        if (media) {
            const isVideo = media.mime.startsWith('video/')

            if (isVideo && !plan.video_enabled) {
                mediaUrl = null
                mimeType = null
            } else {
                const { data: signed } = await supabase
                    .storage
                    .from('onesign-display')
                    .createSignedUrl(media.storage_path, 3600)

                if (signed) {
                    mediaUrl = signed.signedUrl
                    mimeType = media.mime
                }
            }
        }
    }

    // 4. Calculate "Next Check" time using the STORE's timezone
    const nowUtc = new Date()

    const localTimeStr = nowUtc.toLocaleString('en-GB', { timeZone: storeTimezone, hour12: false })
    const timePart = localTimeStr.split(', ')[1]
    const [localH, localM, localS] = timePart.split(':').map(Number)
    const currentTimeVal = localH * 3600 + localM * 60 + localS

    const localDateObj = new Date(nowUtc.toLocaleString('en-US', { timeZone: storeTimezone }))
    const currentDow = localDateObj.getDay()

    const { data: scheds } = await supabase
        .from('display_scheduled_screen_content')
        .select(`
            schedule:display_schedules (
                start_time,
                end_time,
                days_of_week
            )
        `)
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

            if (start > currentTimeVal) {
                const diff = start - currentTimeVal
                if (diff < minDiff) minDiff = diff
            }

            if (end > currentTimeVal) {
                const diff = end - currentTimeVal
                if (diff < minDiff) minDiff = diff
            }
        })

        if (minDiff !== Infinity) {
            nextChange = new Date(nowUtc.getTime() + minDiff * 1000)
        }
    }

    return NextResponse.json({
        screen_id: screen.id,
        refresh_version: screen.refresh_version,
        media: {
            id: mediaId,
            url: mediaUrl,
            type: mimeType
        },
        next_check: nextChange ? nextChange.toISOString() : null,
        fetched_at: new Date().toISOString()
    })
}
