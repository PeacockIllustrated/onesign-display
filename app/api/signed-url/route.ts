import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')

    if (!path) {
        return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // 1. Check Auth & DB Permission
    // We try to find a media_asset record with this path. 
    // If RLS prevents seeing it, this returns null/error.
    const { data: asset, error } = await supabase
        .from('media_assets')
        .select('id')
        .eq('storage_path', path)
        .single()

    if (error || !asset) {
        // Either doesn't exist OR user not allowed to see it
        console.error('[SignedURL] Access denied or not found:', path, error)
        return NextResponse.json({ error: 'Not found or permission denied' }, { status: 403 })
    }

    // 2. Generate URL using Admin Client (Bypass Storage RLS, trust DB RLS)
    const { data } = await adminClient.storage.from('onesign-display').createSignedUrl(path, 3600)

    return NextResponse.json({ url: data?.signedUrl })
}
