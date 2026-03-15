import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { token, display_type, viewport } = body

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update last_seen_at
    const { error } = await supabase
        .from('screens')
        .update({
            last_seen_at: new Date().toISOString(),
            // We could also update display_type here if it changed
        })
        .eq('player_token', token)

    if (error) {
        return NextResponse.json({ error: 'Failed to record ping' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
