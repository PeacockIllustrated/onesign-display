import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const knownVersion = searchParams.get('knownVersion')
    const knownMediaId = searchParams.get('knownMediaId')

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: screen } = await supabase
        .from('screens')
        .select('id, refresh_version') // Select ID for RPC
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
        const { data: resolvedMediaId } = await supabase.rpc('resolve_screen_media', {
            p_screen_id: screen.id,
            p_now: new Date().toISOString()
        })

        // Compare known media ID with currently resolved ID
        // Treat undefined/null as empty string for comparison
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
