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
 *   from('display_screens').select(...).eq('player_token', token).maybeSingle()
 *   from('display_screens').update({ last_seen_at, ... }).eq('id', screen.id)
 *   from('display_screens').update({ player_info }).eq('id', screen.id)   (when the player reports)
 *   from('display_screen_events').insert(...)                           (on online transitions)
 */
function buildMockClient(
    updateResult: { error: any } = { error: null },
    opts: { infoResult?: { error: any }, screen?: any } = {},
) {
    const screen = opts.screen ?? { id: 'screen-1', last_seen_at: new Date().toISOString(), current_status: 'online' }
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: screen, error: null })
    const selectMock = vi.fn().mockReturnValue({
        eq: (...args: any[]) => { eqMock(...args); return { maybeSingle: maybeSingleMock } },
    })
    const updateMock = vi.fn().mockImplementation((values: any) => ({
        eq: (...args: any[]) => {
            eqMock(...args)
            return Promise.resolve('player_info' in values ? (opts.infoResult ?? { error: null }) : updateResult)
        },
    }))
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const fromMock = vi.fn().mockReturnValue({ select: selectMock, update: updateMock, insert: insertMock })

    return {
        from: fromMock,
        _mocks: { fromMock, selectMock, updateMock, eqMock, insertMock },
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
        expect(client._mocks.eqMock).toHaveBeenCalledWith('id', 'screen-1')
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

    // ----- Device report -------------------------------------------------

    it('saves a parsed device report when the player sends one', async () => {
        const client = buildMockClient()
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const ua = 'Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        const res = await POST(makeRequest({ token: 'valid-token', viewport: '1920x1080', player: { ua, offline_cache: true } }))
        expect(res.status).toBe(200)

        const infoCall = client._mocks.updateMock.mock.calls.find((c: any[]) => 'player_info' in c[0])
        expect(infoCall).toBeTruthy()
        expect(infoCall![0].player_info).toMatchObject({ label: 'Chromium 124 on Android', verdict: 'good', offline_cache: true, viewport: '1920x1080' })
    })

    it('still returns 200 if the device report cannot be saved', async () => {
        const client = buildMockClient({ error: null }, { infoResult: { error: { message: 'column player_info does not exist' } } })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await POST(makeRequest({ token: 'valid-token', player: { ua: 'x' } }))
        expect(res.status).toBe(200)
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
