import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const DemoRequestSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(254),
    company: z.string().max(200).nullish(),
    plan: z.string().max(100).nullish(),
    screens: z.string().max(50).nullish(),
    message: z.string().max(2000).nullish(),
})

export async function POST(request: NextRequest) {
    // IP-based rate limit: max 5 demo requests per hour
    const ip = getClientIp(request)
    const limited = rateLimit('demo-request', ip, { maxRequests: 5, windowMs: 3600000 })
    if (limited) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()

        const parsed = DemoRequestSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { name, email, company, plan, screens, message } = parsed.data

        // Use admin client — prospects table needs insert access for public form submissions
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from('display_prospects')
            .insert({
                name,
                email,
                company: company || null,
                plan: plan || null,
                screens: screens || null,
                message: message || null,
                status: 'new',
            })
            .select()
            .single()

        if (error) {
            console.error('Failed to save prospect:', error)
            return NextResponse.json(
                { error: 'Failed to save demo request' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, id: data.id })
    } catch (error) {
        console.error('Demo request error:', error)
        return NextResponse.json(
            { error: 'Failed to process demo request' },
            { status: 500 }
        )
    }
}
