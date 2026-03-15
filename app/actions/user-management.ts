'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Note: This creates the profile. The actual Auth User creation usually happens via signUp or Admin API.
// Since we don't have the Service Key exposed in client actions (and shouldn't), we have two options:
// 1. Admin API (requires service key) -> We can import it if it's available in env.
// 2. Just create the Profile and assume the user will sign up? No, profile links to auth.id.
// 3. We use `supabase.auth.admin.createUser` if we are in a server action with service role.

// We will try to use the SERVICE ROLE key here to create the auth user.
// IMPORTANT: This file must be secure. It checks if the caller is Super Admin.

export async function createUserForClient(clientId: string, email: string, name: string, role: 'client_admin' | 'super_admin' = 'client_admin') {
    const supabase = await createClient() // Authenticated client to check requester role

    // 1. Check Requester Permissions
    const { data: { user: requestor } } = await supabase.auth.getUser()
    if (!requestor) return { error: 'Unauthorized' }

    const { data: requestorProfile } = await supabase.from('profiles').select('role').eq('id', requestor.id).single()
    if (requestorProfile?.role !== 'super_admin') {
        return { error: 'Unauthorized: Super Admin only' }
    }

    // 2. Create Auth User using Service Role (Admin)
    // We need a specific Admin client here. Using `createAdminClient` if available or manual.
    // We'll assume `createAdminClient` exists in `@/lib/supabase/server` since we saw it in `ingest/route.ts`.

    // Dynamic import to avoid circular dep issues if any, or just import at top.
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = await createAdminClient()

    // Temporary password logic - in production, send invite email.
    // For now, we set a default password or generated one.
    const tempPassword = 'password123'

    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name }
    })

    if (authError) {
        return { error: `Auth Error: ${authError.message}` }
    }

    if (!newUser.user) return { error: 'Failed to create user' }

    // 3. Create Profile
    // The trigger might handle this? Let's check schema.
    // Schema has `create table profiles`. No triggers mentioned in the snippet I read.
    // So we manually insert the profile.

    const { error: profileError } = await adminClient.from('profiles').insert({
        id: newUser.user.id,
        role,
        client_id: role === 'super_admin' ? null : clientId, // Super admins generally don't have a client_id
        name
    })

    if (profileError) {
        // Rollback auth user? 
        await adminClient.auth.admin.deleteUser(newUser.user.id)
        return { error: `Profile Error: ${profileError.message}` }
    }

    revalidatePath(`/app/clients/${clientId}`)
    return { success: true, user: newUser.user, temporaryPassword: tempPassword }
}
