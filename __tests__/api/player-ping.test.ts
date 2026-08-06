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
 * The ping route now does three things (status-transition detection):
 *   1. from('display_screens').select(...).eq('player_token', token).maybeSingle()
 *   2. from('display_screens').update({...}).eq('id', screen.id)   → awaited { error }
 *   3. on offline→online transition: from('display_screen_events').insert({...})
 */
function buildMockClient(opts: {
    screen?: { id: string; last_seen_at: string | null; current_status: string | null } | null
    updateError?: any
} = {}) {
    const screen =
        opts.screen === undefined
            ? { id: 'scr-1', last_seen_at: null, current_status: null }
            : opts.screen

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: screen, error: null })
    const selectEqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
    const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock })

    const updateEqMock = vi.fn().mockResolvedValue({ error: opts.updateError ?? null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock })

    const insertMock = vi.fn().mockResolvedValue({ error: null })

    const fromMock = vi.fn().mockReturnValue({
        select: selectMock,
        update: updateMock,
        insert: insertMock,
    })

    return {
        from: fromMock,
        _mocks: { fromMock, selectMock, selectEqMock, maybeSingleMock, updateMock, updateEqMock, insertMock },
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
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await POST(makeRequest({ token: 'valid-token' }))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
    })

    it('updates last_seen_at with current ISO timestamp and marks the screen online', async () => {
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const before = new Date().toISOString()
        await POST(makeRequest({ token: 'valid-token' }))
        const after = new Date().toISOString()

        // Verify .update() was called with a last_seen_at in range
        const updateCall = client._mocks.updateMock.mock.calls[0][0]
        expect(updateCall).toHaveProperty('last_seen_at')
        expect(updateCall.last_seen_at >= before).toBe(true)
        expect(updateCall.last_seen_at <= after).toBe(true)
        expect(updateCall.current_status).toBe('online')
    })

    it('looks up by player_token, then updates by screen id', async () => {
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'specific-token' }))

        expect(client._mocks.selectEqMock).toHaveBeenCalledWith('player_token', 'specific-token')
        expect(client._mocks.updateEqMock).toHaveBeenCalledWith('id', 'scr-1')
    })

    it('queries the display_screens table', async () => {
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'valid-token' }))

        expect(client.from).toHaveBeenCalledWith('display_screens')
    })

    // ----- Status transitions -------------------------------------------

    it('logs an online event when a screen comes back after a gap', async () => {
        const client = buildMockClient({
            screen: { id: 'scr-1', last_seen_at: null, current_status: 'offline' },
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'valid-token' }))

        expect(client.from).toHaveBeenCalledWith('display_screen_events')
        expect(client._mocks.insertMock).toHaveBeenCalledWith(
            expect.objectContaining({ screen_id: 'scr-1', event_type: 'online' }),
        )
    })

    it('does not log an event when the screen was already online recently', async () => {
        const client = buildMockClient({
            screen: {
                id: 'scr-1',
                last_seen_at: new Date().toISOString(),
                current_status: 'online',
            },
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await POST(makeRequest({ token: 'valid-token' }))

        expect(client._mocks.insertMock).not.toHaveBeenCalled()
    })

    // ----- Error handling -----------------------------------------------

    it('returns 404 when no screen matches the token', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await POST(makeRequest({ token: 'unknown-token' }))
        expect(res.status).toBe(404)
    })

    it('returns 500 when supabase update fails', async () => {
        const client = buildMockClient({ updateError: { message: 'DB down' } })
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
