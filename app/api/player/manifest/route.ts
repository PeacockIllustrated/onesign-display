import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // ... params handling ...
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Find Screen by Token
    const { data: screen } = await supabase
        .from('display_screens')
        .select('id, store_id, refresh_version, store:display_stores(client_id)')
        .eq('player_token', token)
        .single() // @ts-ignore

    if (!screen) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 2. Fetch Plan & Status
    // @ts-ignore
    const clientId = screen.store?.client_id
    const { data: planRaw } = await supabase.from('display_client_plans').select('*').eq('client_id', clientId).single()

    const plan = planRaw || {
        status: 'active',
        video_enabled: false // Default to safe if missing
    }

    // Check Plan Status
    if (plan.status === 'paused' || plan.status === 'cancelled') {
        return NextResponse.json({
            screen_id: screen.id,
            refresh_version: screen.refresh_version,
            media: {
                id: null,
                url: 'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?q=80&w=2546&auto=format&fit=crop', // Generic "Service Paused" placeholder
                type: 'image/jpeg'
            },
            next_check: new Date(Date.now() + 60000).toISOString(), // Check back in 1 min
            fetched_at: new Date().toISOString()
        })
    }

    // 3. Resolve Content (Server-Side Logic)
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
                // Fallback: Plan doesn't allow video
                // Ideally attempt to find latest image, but for now safe placeholder
                // TODO: Implement "latest static image" lookup?
                mediaUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' // "Nice Abstract" fallback
                mimeType = 'image/jpeg'
            } else {
                // Generate Signed URL
                const { data: signed } = await supabase
                    .storage
                    .from('onesign-display')
                    .createSignedUrl(media.storage_path, 3600) // 1 Hour

                if (signed) {
                    mediaUrl = signed.signedUrl
                    mimeType = media.mime
                }
            }
        }
    }

    // 3. Calculate "Next Check" Time (Optimization)
    const now = new Date()
    const currentTimeVal = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const currentDow = now.getDay()

    // Fetch relevant schedules for this screen
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

    if (scheds) {
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

            // Check Start Time
            if (start > currentTimeVal) {
                const diff = start - currentTimeVal
                if (diff < minDiff) minDiff = diff
            }

            // Check End Time
            if (end > currentTimeVal) {
                const diff = end - currentTimeVal
                if (diff < minDiff) minDiff = diff
            }
        })

        if (minDiff !== Infinity) {
            nextChange = new Date(now.getTime() + minDiff * 1000)
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
