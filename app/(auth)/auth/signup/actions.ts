'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { PLAN_DEFS, SELF_SERVE_PLANS, type PlanCode } from '@/lib/slate/plans'

const SignupSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    business_name: z.string().min(1, 'Business name is required').max(255),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    plan: z.enum(['static_design', 'video_design_system', 'pro_managed'] as const),
})

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
}

export async function signup(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const parsed = SignupSchema.safeParse(data)

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]
        return { error: firstError.message }
    }

    const { name, business_name, email, password, plan } = parsed.data
    const planCode = plan as PlanCode

    if (!SELF_SERVE_PLANS.includes(planCode)) {
        return { error: 'Invalid plan selected' }
    }

    const adminClient = await createAdminClient()
    let userId: string | null = null
    let clientId: string | null = null

    try {
        // 1. Create auth user
        const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
        })

        if (authError) {
            // Generic message for all auth failures — prevents email enumeration
            return { error: 'Unable to create account. Please check your details or try signing in.' }
        }

        if (!newUser.user) return { error: 'Failed to create account' }
        userId = newUser.user.id

        // 2. Create client with slug (retry on collision)
        let slug = generateSlug(business_name)
        let { data: client, error: clientError } = await adminClient
            .from('display_clients')
            .insert({ name: business_name, slug })
            .select('id')
            .single()

        if (clientError?.code === '23505') {
            // Slug collision — append random suffix
            const bytes = new Uint8Array(3)
            crypto.getRandomValues(bytes)
            const suffix = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 6)
            slug = `${slug}-${suffix}`
            const retry = await adminClient
                .from('display_clients')
                .insert({ name: business_name, slug })
                .select('id')
                .single()
            client = retry.data
            clientError = retry.error
        }

        if (clientError || !client) {
            throw new Error(`Failed to create business: ${clientError?.message}`)
        }
        clientId = client.id

        // 3. Create profile
        const { error: profileError } = await adminClient
            .from('display_profiles')
            .insert({
                id: userId,
                role: 'client_admin',
                client_id: clientId,
                name,
                onboarding_completed: false,
            })

        if (profileError) {
            throw new Error(`Failed to create profile: ${profileError.message}`)
        }

        // 4. Create plan with trial payment status
        const entitlements = PLAN_DEFS[planCode]
        const { error: planError } = await adminClient
            .from('display_client_plans')
            .insert({
                client_id: clientId,
                plan_code: planCode,
                status: 'active',
                payment_status: 'trial',
                max_screens: entitlements.max_screens,
                video_enabled: entitlements.video_enabled,
                specials_studio_enabled: entitlements.specials_studio_enabled,
                scheduling_enabled: entitlements.scheduling_enabled,
                four_k_enabled: entitlements.four_k_enabled,
                design_package_included: entitlements.design_package_included,
                managed_design_support: entitlements.managed_design_support,
            })

        if (planError) {
            throw new Error(`Failed to create plan: ${planError.message}`)
        }

        // 5. Sign in the user (sets session cookies)
        const supabase = await createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            throw new Error(`Account created but sign-in failed: ${signInError.message}`)
        }

    } catch (err: any) {
        // Rollback: delete auth user and client if created
        if (userId) {
            await adminClient.auth.admin.deleteUser(userId)
        }
        if (clientId) {
            await adminClient.from('display_client_plans').delete().eq('client_id', clientId)
            await adminClient.from('display_clients').delete().eq('id', clientId)
        }
        return { error: err.message || 'Something went wrong. Please try again.' }
    }

    revalidatePath('/app', 'layout')
    redirect('/app')
}
