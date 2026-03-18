import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — declared before the route import
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
    rateLimit: vi.fn().mockReturnValue(null),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

import { POST } from '@/app/api/player/ping/route'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, any>) {
    return new NextRequest('http://localhost/api/player/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

/**
 * The ping route calls:
 *   supabase.from('display_screens').update({...}).eq('player_token', token)
 *
 * Unlike the other routes, this chain does NOT end with .single().
 * The terminal value is the awaited result of .eq() (the last chain link).
 */
function buildMockClient(updateResult: { error: any } = { error: null }) {
    const eqMock = vi.fn().mockResolvedValue(updateResult)
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ update: updateMock })

    return {
        from: fromMock,
        _mocks: { fromMock, updateMock, eqMock },
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/player/ping', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue(null)
    })

    // ----- Validation --------------------------------------------------

    it('returns 400 when token is missing', async () => {
        const res = await POST(makeRequest({}))
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('Missing or invalid token')
    })

    it('returns 400 when token is empty string', async () => {
        const res = await POST(makeRequest({ token: '' }))
        expect(res.status).toBe(400)
    })

    it('returns 400 when token exceeds 255 characters', async () => {
        const res = await POST(makeRequest({ token: 'z'.repeat(256) }))
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('Missing or invalid token')
    })

    it('accepts a 255-char token (boundary)', async () => {
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await POST(makeRequest({ token: 'b'.repeat(255) }))
        // Should proceed past validation — either 200 or 500, not 400
        expect(res.status).not.toBe(400)
    })

    // ----- Rate limiting -----------------------------------------------

    it('returns 429 when rate limited', async () => {
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue({ retryAfter: 20 })

        const res = await POST(makeRequest({ token: 'some-token' }))
        expect(res.status).toBe(429)
        const body = await res.json()
        expect(body.error).toBe('Too many requests')
    })

    it('passes correct rate limit params (3 req / 60s)', async () => {
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue({ retryAfter: 5 })

        await POST(makeRequest({ token: 'tk-abc' }))

        expect(rateLimit).toHaveBeenCalledWith('player-ping', 'tk-abc', {
            maxRequests: 3,
            windowMs: 60000,
        })
    })

    // ----- Successful ping --------------------------------------------

    it('returns 200 { success: true } on valid ping', async () => {
        const client = buildMockClient({ error: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await POST(makeRequest({ token: 'valid-token' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
    })

    it('updates last_seen_at with current ISO timestamp', async () => {
        const client = buildMockClient({ error: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const before = new Date().toISOString()
        await POST(makeRequest({ token: 'valid-token' }))
        const after = new Date().toISOString()

        // Verify .update() was called with a last_seen_at in range
        const updateCall = client._mocks.updateMock.mock.calls[0][0]
        expect(updateCall).toHaveProperty('last_seen_at')
        expect(updateCall.last_seen_at >= before).toBe(true)
        expect(updateCall.last_seen_at <= after).toBe(true)
    })

    it('filters by player_token in the eq call', async () => {
        const client = buildMockClient({ error: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'specific-token' }))

        expect(client._mocks.eqMock).toHaveBeenCalledWith('player_token', 'specific-token')
    })

    it('queries the display_screens table', async () => {
        const client = buildMockClient({ error: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'valid-token' }))

        expect(client.from).toHaveBeenCalledWith('display_screens')
    })

    // ----- Error handling -----------------------------------------------

    it('returns 500 when supabase update fails', async () => {
        const client = buildMockClient({ error: { message: 'DB down' } })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await POST(makeRequest({ token: 'valid-token' }))
        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.error).toBe('Failed to record ping')
    })

    // ----- Critical: uses createAdminClient, NOT createClient ----------

    it('calls createAdminClient (verifies bug fix — not createClient)', async () => {
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'any-token' }))

        expect(createAdminClient).toHaveBeenCalled()
        expect(createClient).not.toHaveBeenCalled()
    })
})
