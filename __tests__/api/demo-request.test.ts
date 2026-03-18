import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
    createAdminClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
    rateLimit: vi.fn().mockReturnValue(null),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

import { POST } from '@/app/api/demo-request/route'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

function mockChain(finalValue: any = { data: { id: 'prospect-1' }, error: null }) {
    const chain: any = {}
    const methods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'neq', 'order']
    methods.forEach(m => { chain[m] = vi.fn().mockReturnValue(chain) })
    chain.single = vi.fn().mockResolvedValue(finalValue)
    return chain
}

function makeRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('POST /api/demo-request', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(rateLimit).mockReturnValue(null)

        const chain = mockChain()
        vi.mocked(createAdminClient).mockResolvedValue(chain)
    })

    // ── Validation: empty name ──────────────────────────────────────
    it('returns 400 when name is empty', async () => {
        const res = await POST(makeRequest({ name: '', email: 'a@b.com' }))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.error).toBe('Invalid input')
        expect(data.details.name).toBeDefined()
    })

    // ── Validation: invalid email ───────────────────────────────────
    it('returns 400 for an invalid email format', async () => {
        const res = await POST(makeRequest({ name: 'Jo', email: 'not-an-email' }))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.details.email).toBeDefined()
    })

    // ── Validation: name exceeds 100 characters ─────────────────────
    it('returns 400 when name exceeds 100 characters', async () => {
        const res = await POST(makeRequest({ name: 'A'.repeat(101), email: 'a@b.com' }))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.details.name).toBeDefined()
    })

    // ── Validation: email exceeds 254 characters ────────────────────
    it('returns 400 when email exceeds 254 characters', async () => {
        const longEmail = 'a'.repeat(246) + '@test.com' // 255 chars, exceeds 254 max
        const res = await POST(makeRequest({ name: 'Jo', email: longEmail }))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.details.email).toBeDefined()
    })

    // ── Validation: message exceeds 2000 characters ─────────────────
    it('returns 400 when message exceeds 2000 characters', async () => {
        const res = await POST(makeRequest({
            name: 'Jo',
            email: 'a@b.com',
            message: 'x'.repeat(2001),
        }))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.details.message).toBeDefined()
    })

    // ── Valid minimal request ────────────────────────────────────────
    it('returns 200 with success for a valid minimal request', async () => {
        const res = await POST(makeRequest({ name: 'Jo', email: 'jo@test.com' }))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.success).toBe(true)
        expect(data.id).toBe('prospect-1')
    })

    // ── Valid full request ───────────────────────────────────────────
    it('returns 200 with all optional fields provided', async () => {
        const res = await POST(makeRequest({
            name: 'Jo Smith',
            email: 'jo@test.com',
            company: 'Acme Ltd',
            plan: 'Onesign Pro',
            screens: '3',
            message: 'Interested in a demo',
        }))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.success).toBe(true)
    })

    // ── Supabase insert passes correct data ─────────────────────────
    it('inserts prospect with status "new" and nullifies empty optionals', async () => {
        const chain = mockChain()
        vi.mocked(createAdminClient).mockResolvedValue(chain)

        await POST(makeRequest({ name: 'Jo', email: 'jo@test.com' }))

        expect(chain.from).toHaveBeenCalledWith('display_prospects')
        expect(chain.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Jo',
                email: 'jo@test.com',
                status: 'new',
                company: null,
                plan: null,
                screens: null,
                message: null,
            })
        )
    })

    // ── Rate limited ────────────────────────────────────────────────
    it('returns 429 when rate limited', async () => {
        vi.mocked(rateLimit).mockReturnValue({ retryAfter: 3500 })

        const res = await POST(makeRequest({ name: 'Jo', email: 'jo@test.com' }))
        expect(res.status).toBe(429)

        const data = await res.json()
        expect(data.error).toMatch(/too many requests/i)
    })

    // ── DB insert failure returns 500 ───────────────────────────────
    it('returns 500 when database insert fails', async () => {
        const chain = mockChain({ data: null, error: { message: 'DB down' } })
        vi.mocked(createAdminClient).mockResolvedValue(chain)

        const res = await POST(makeRequest({ name: 'Jo', email: 'jo@test.com' }))
        expect(res.status).toBe(500)

        const data = await res.json()
        expect(data.error).toMatch(/failed to save/i)
    })
})
