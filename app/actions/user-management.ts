'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUserForClient(clientId: string, email: string, name: string, role: 'client_admin' | 'super_admin' = 'client_admin') {
    const supabase = await createClient()

    // 1. Check Requester Permissions
    const { data: { user: requestor } } = await supabase.auth.getUser()
    if (!requestor) return { error: 'Unauthorized' }

    const { data: requestorProfile } = await supabase.from('display_profiles').select('role').eq('id', requestor.id).single()
    if (requestorProfile?.role !== 'super_admin') {
        return { error: 'Unauthorized: Super Admin only' }
    }

    // Validate inputs
    if (!email || !email.includes('@') || email.length > 254) {
        return { error: 'Invalid email address' }
    }
    if (!name || name.length > 255) {
        return { error: 'Invalid name' }
    }
    if (!clientId) {
        return { error: 'Client ID is required' }
    }

    // 2. Create Auth User using Service Role
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = await createAdminClient()

    // Generate cryptographically secure temporary password
    const randomBytes = new Uint8Array(16)
    crypto.getRandomValues(randomBytes)
    const tempPassword = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name }
    })

    if (authError) {
        console.error('[UserCreation] Auth error:', authError.message)
        if (authError.message.includes('already been registered')) {
            return { error: 'A user with this email already exists.' }
        }
        return { error: `Failed to create user: ${authError.message}` }
    }

    if (!newUser.user) return { error: 'Failed to create user' }

    // 3. Create Profile
    const { error: profileError } = await adminClient.from('display_profiles').insert({
        id: newUser.user.id,
        role,
        client_id: role === 'super_admin' ? null : clientId,
        name
    })

    if (profileError) {
        // Rollback auth user
        await adminClient.auth.admin.deleteUser(newUser.user.id)
        console.error('[UserCreation] Profile error:', profileError.message)
        return { error: `Failed to create profile: ${profileError.message}` }
    }

    revalidatePath(`/app/clients/${clientId}`)
    // Return temp password so admin can share securely — do NOT log it
    return { success: true, userId: newUser.user.id, temporaryPassword: tempPassword }
}
