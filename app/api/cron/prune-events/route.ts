import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

const RETENTION_DAYS = 30

function authorised(request: NextRequest): boolean {
    const expected = process.env.CRON_SECRET
    if (!expected) return false
    const auth = request.headers.get('authorization') ?? ''
    const expectedHeader = `Bearer ${expected}`
    const a = Buffer.from(auth)
    const b = Buffer.from(expectedHeader)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
    if (!authorised(request)) {
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

    // Expired pairing codes are useless after a day. Best-effort: the table
    // only exists once the player-reliability migration has run.
    await supabase
        .from('display_pairing_codes')
        .delete()
        .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then(({ error: pairErr }: { error: { message: string } | null }) => {
            if (pairErr) console.warn('[cron/prune-events] pairing prune skipped:', pairErr.message)
        })

    return NextResponse.json({ deleted: count ?? 0, cutoff })
}
