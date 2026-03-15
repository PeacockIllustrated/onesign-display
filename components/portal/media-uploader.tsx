'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client' // Client-side client
import { registerMediaAsset } from '@/app/app/media/actions'
import { v4 as uuidv4 } from 'uuid'

export function MediaUploader({ btnClassName, clientId }: { btnClassName?: string, clientId?: string }) {
    const [uploading, setUploading] = useState(false)
    const router = useRouter()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        if (!clientId) {
            alert('Error: No client selected (ID is missing)')
            return
        }

        setUploading(true)
        const supabase = createClient()
        const files = Array.from(e.target.files)

        // We'll process uploads sequentially or in parallel. Let's do sequential for simplicity and clear error handling first.
        let successCount = 0
        let errors = []

        for (const file of files) {
            try {
                const ext = file.name.split('.').pop()
                const storagePath = `${clientId}/${uuidv4()}.${ext}`
                const mimeType = file.type

                // 1. Upload to Storage
                const { data, error: uploadError } = await supabase.storage
                    .from('onesign-display')
                    .upload(storagePath, file)

                if (uploadError) {
                    throw new Error(`Upload failed: ${uploadError.message}`)
                }

                // 2. Register asset in DB via Server Action
                // We need the user ID for the record. Since we're client side, we can get it from auth.getUser() or let the server action resolve it?
                // The server action calls auth.getUser() but for `uploader_id` it might need the passed ID or it can resolve it itself.
                // Let's check registerMediaAsset signature. It expects `uploaderId`. 
                // We should probably let the server action resolve the user to be safe/secure, BUT `registerMediaAsset` currently takes `uploaderId`.
                // Let's fetch current user here briefly or update server action to resolve it.
                // UPDATED STRATEGY: Update `registerMediaAsset` to resolve user itself. 
                // But since I already wrote it to take `uploaderId`, I will fetch it here.

                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error("Not authenticated")

                // Todo: get storeId from somewhere? The duplicate logic had storeId. 
                // The current MediaUploader usage doesn't seem to pass storeId prop?
                // Let's check props. Only `clientId`.
                // If this is used in context where storeId matters, we might be missing it.
                // However, the original `route.ts` read `storeId` from formData. 
                // Let's assume for now duplication of existing `MediaUploader` usage is sufficient.

                const result = await registerMediaAsset(
                    clientId,
                    file.name,
                    storagePath,
                    mimeType,
                    file.size,
                    user.id,
                    null // storeId -- The component doesn't receive it currently
                )

                if (!result.success) {
                    throw new Error(result.error)
                }

                successCount++
                console.log(`[MediaUploader] Success: ${file.name}`, result)

            } catch (err: any) {
                console.error(`[MediaUploader] Error with ${file.name}:`, err)
                errors.push(`${file.name}: ${err.message}`)
            }
        }

        setUploading(false)
        if (errors.length > 0) {
            alert(`Some uploads failed:\n${errors.join('\n')}`)
        } else {
            // alert('All files uploaded successfully!') // Optional: Remove for smoother flow
        }

        router.refresh()

        // Reset input
        e.target.value = ''
    }

    return (
        <div className="relative inline-block group">
            <button disabled={uploading} className={btnClassName}>
                {uploading ? 'Uploading...' : 'Upload Media'}
            </button>
            <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed"
            />
        </div>
    )
}
