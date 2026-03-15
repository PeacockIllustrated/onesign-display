'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const data = Object.fromEntries(formData)
    const parsed = LoginSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid input' }
    }

    const { email, password } = parsed.data

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/app', 'layout')
    redirect('/app')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/login')
}
