import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        console.log('[Upload] Ingest API Hit')

        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
        console.log('[Upload] Has Service Role Key:', hasServiceKey)

        if (!hasServiceKey) {
            console.error('[Upload] Missing SUPABASE_SERVICE_ROLE_KEY')
            return NextResponse.json({ error: 'Config Error: Missing Service Key' }, { status: 500 })
        }

        const supabase = await createClient()
        const adminClient = await createAdminClient()

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // Mock user for upload logic
        // const user = { id: 'debug-user' }

        // 2. Parse FormData
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]
        const clientId = formData.get('clientId') as string
        const storeId = formData.get('storeId') as string // Optional

        console.log(`[Upload] Processing ${files.length} files for client ${clientId}`)

        if (!files.length || !clientId) {
            console.error('[Upload] Missing files or clientId')
            return NextResponse.json({ error: 'Missing files or clientId' }, { status: 400 })
        }

        const results = []

        // 3. Process Each File
        for (const file of files) {
            const ext = file.name.split('.').pop()
            const storagePath = `${clientId}/${uuidv4()}.${ext}`
            console.log(`[Upload] Uploading ${file.name} to ${storagePath}`)

            // Upload to Storage (Using Admin Client to bypass RLS for now if policies are strict)
            const { data, error: uploadError } = await adminClient
                .storage
                .from('onesign-display')
                .upload(storagePath, file)

            if (uploadError) {
                console.error(`[Upload] Failed to upload ${file.name}:`, uploadError)
                results.push({ file: file.name, status: 'error', error: uploadError.message })
                continue
            } else {
                console.log(`[Upload] Success: ${storagePath}`)
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
                // ... (existing logic) ...
                // Find matching screen in this store
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
        console.error('[Upload] CRITICAL ERROR:', e)
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 })
    }
}
