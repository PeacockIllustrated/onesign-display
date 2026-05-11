import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const RETENTION_DAYS = 30

export async function GET(request: NextRequest) {
    const auth = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET
    if (!expected || auth !== `Bearer ${expected}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { error, count } = await supabase
        .from('display_screen_events')
        .delete({ count: 'exact' })
        .lt('created_at', cutoff)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: count ?? 0, cutoff })
}
