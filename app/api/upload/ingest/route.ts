import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
])

const MAX_FILES_PER_REQUEST = 20

export async function POST(request: NextRequest) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Upload] Missing SUPABASE_SERVICE_ROLE_KEY')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = await createClient()
        const adminClient = await createAdminClient()

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse FormData
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]
        const clientId = formData.get('clientId') as string
        const storeId = formData.get('storeId') as string // Optional

        if (!files.length || !clientId) {
            return NextResponse.json({ error: 'Missing files or clientId' }, { status: 400 })
        }

        if (files.length > MAX_FILES_PER_REQUEST) {
            return NextResponse.json({ error: `Max ${MAX_FILES_PER_REQUEST} files per upload` }, { status: 400 })
        }

        // Verify user has permission to upload to this client
        const { data: profile } = await supabase
            .from('display_profiles')
            .select('role, client_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
        }

        const isSuperAdmin = profile.role === 'super_admin'
        const isOwner = profile.role === 'client_admin' && profile.client_id === clientId

        if (!isSuperAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden: Cannot upload to this client' }, { status: 403 })
        }

        const results = []

        // 3. Process Each File
        for (const file of files) {
            // Validate MIME type
            if (!ALLOWED_MIME_TYPES.has(file.type)) {
                results.push({ file: file.name, status: 'rejected', error: `Unsupported file type: ${file.type}` })
                continue
            }

            // Sanitize extension from MIME type (ignore user-supplied extension)
            const mimeToExt: Record<string, string> = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'image/gif': 'gif',
                'video/mp4': 'mp4',
                'video/quicktime': 'mov',
            }
            const ext = mimeToExt[file.type] || 'bin'
            const storagePath = `${clientId}/${uuidv4()}.${ext}`

            // Upload to Storage
            const { error: uploadError } = await adminClient
                .storage
                .from('onesign-display')
                .upload(storagePath, file)

            if (uploadError) {
                console.error(`[Upload] Storage error for ${file.name}:`, uploadError.message)
                results.push({ file: file.name, status: 'error', error: uploadError.message })
                continue
            }

            // Create DB Record
            const { data: asset, error: dbError } = await supabase
                .from('display_media_assets')
                .insert({
                    client_id: clientId,
                    store_id: storeId || null,
                    uploader_id: user.id,
                    filename: file.name,
                    storage_path: storagePath,
                    mime: file.type,
                    bytes: file.size
                })
                .select()
                .single()

            if (dbError) {
                results.push({ file: file.name, status: 'db_error', error: dbError.message })
                continue
            }

            // 4. Batch Logic (Prefix Parsing)
            const name = file.name.toLowerCase()
            let assignedScreenIndex = null
            let assignedOrientation = null

            if (name.includes('screen_1_')) assignedScreenIndex = 1
            else if (name.includes('screen_2_')) assignedScreenIndex = 2
            else if (name.includes('screen_3_')) assignedScreenIndex = 3
            else if (name.includes('screen_4_')) assignedScreenIndex = 4

            if (name.includes('vertical') || name.includes('screen_v_')) assignedOrientation = 'portrait'

            // Get Public URL
            const { data: { publicUrl } } = adminClient.storage.from('onesign-display').getPublicUrl(storagePath)

            if (storeId && (assignedScreenIndex || assignedOrientation)) {
                let query = supabase.from('display_screens').select('id, refresh_version').eq('store_id', storeId)

                if (assignedScreenIndex) query = query.eq('index_in_set', assignedScreenIndex).eq('orientation', 'landscape')
                else if (assignedOrientation) query = query.eq('orientation', assignedOrientation)

                const { data: screens } = await query

                if (screens && screens.length > 0) {
                    const targetScreen = screens[0]

                    // Deactivate old active content
                    await supabase.from('display_screen_content').update({ active: false }).eq('screen_id', targetScreen.id)

                    // Insert new active content
                    await supabase.from('display_screen_content').insert({
                        screen_id: targetScreen.id,
                        media_asset_id: asset.id,
                        active: true
                    })

                    // Increment Refresh Version
                    await supabase.from('display_screens').update({ refresh_version: (targetScreen.refresh_version || 0) + 1 }).eq('id', targetScreen.id)

                    results.push({ file: file.name, status: 'assigned', screen: targetScreen.id, publicUrl, mediaId: asset.id })
                } else {
                    results.push({ file: file.name, status: 'uploaded_no_screen_match', publicUrl, mediaId: asset.id })
                }
            } else {
                results.push({ file: file.name, status: 'uploaded', publicUrl, mediaId: asset.id })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (e: any) {
        console.error('[Upload] Critical error:', e.message)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
