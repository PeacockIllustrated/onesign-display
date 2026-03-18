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

import { GET } from '@/app/api/player/refresh/route'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}) {
    const url = new URL('http://localhost/api/player/refresh')
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return new NextRequest(url)
}

/**
 * The refresh route calls:
 *   1. from('display_screens').select('id, refresh_version').eq(...).single()
 *   2. rpc('display_resolve_screen_media', ...)   — only when version matches
 */
function buildMockClient(opts: {
    screen?: any
    resolvedMediaId?: any
}) {
    const { screen = null, resolvedMediaId = null } = opts

    const screenChain: any = {}
    const passthrough = ['select', 'eq', 'neq', 'order']
    passthrough.forEach((m) => {
        screenChain[m] = vi.fn().mockReturnValue(screenChain)
    })
    screenChain.single = vi.fn().mockResolvedValue({ data: screen, error: null })

    const client: any = {
        from: vi.fn().mockReturnValue(screenChain),
        rpc: vi.fn().mockResolvedValue({
            data: resolvedMediaId
                ? [{ resolved_media_id: resolvedMediaId, resolved_playlist_id: null }]
                : [{ resolved_media_id: null, resolved_playlist_id: null }],
            error: null,
        }),
    }

    return client
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/player/refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue(null)
    })

    // ----- Validation --------------------------------------------------

    it('returns 400 when token is missing', async () => {
        const res = await GET(makeRequest())
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('Missing or invalid token')
    })

    it('returns 400 when token exceeds 255 characters', async () => {
        const res = await GET(makeRequest({ token: 'x'.repeat(256) }))
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('Missing or invalid token')
    })

    it('accepts a 255-char token (boundary)', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'a'.repeat(255) }))
        expect(res.status).toBe(401) // invalid token, not 400
    })

    // ----- Rate limiting -----------------------------------------------

    it('returns 429 when rate limited', async () => {
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue({ retryAfter: 45 })

        const res = await GET(makeRequest({ token: 'some-token' }))
        expect(res.status).toBe(429)
        const body = await res.json()
        expect(body.error).toBe('Too many requests')
    })

    it('passes correct rate limit params', async () => {
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue({ retryAfter: 10 })

        await GET(makeRequest({ token: 'tk-123' }))

        expect(rateLimit).toHaveBeenCalledWith('player-refresh', 'tk-123', {
            maxRequests: 6,
            windowMs: 60000,
        })
    })

    // ----- Auth --------------------------------------------------------

    it('returns 401 for invalid token (screen not found)', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'bad-token' }))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.error).toBe('Invalid token')
    })

    // ----- Version-based refresh ---------------------------------------

    it('returns should_refresh: true when server version > known version', async () => {
        const client = buildMockClient({
            screen: { id: 'scr-1', refresh_version: 5 },
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'valid', knownVersion: '3' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.should_refresh).toBe(true)
        expect(body.current_version).toBe(5)
    })

    it('returns should_refresh: true when no knownVersion provided', async () => {
        const client = buildMockClient({
            screen: { id: 'scr-2', refresh_version: 1 },
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'valid' }))
        const body = await res.json()

        // knownVersion defaults to -1, so 1 > -1 → true
        expect(body.should_refresh).toBe(true)
    })

    // ----- Media-based refresh -----------------------------------------

    it('returns should_refresh: true when media changed', async () => {
        const client = buildMockClient({
            screen: { id: 'scr-3', refresh_version: 2 },
            resolvedMediaId: 'media-new',
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(
            makeRequest({
                token: 'valid',
                knownVersion: '2',       // version matches
                knownMediaId: 'media-old', // media differs
            })
        )
        const body = await res.json()

        expect(body.should_refresh).toBe(true)
    })

    // ----- No change ---------------------------------------------------

    it('returns should_refresh: false when nothing changed', async () => {
        const client = buildMockClient({
            screen: { id: 'scr-4', refresh_version: 2 },
            resolvedMediaId: 'media-same',
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(
            makeRequest({
                token: 'valid',
                knownVersion: '2',
                knownMediaId: 'media-same',
            })
        )
        const body = await res.json()

        expect(body.should_refresh).toBe(false)
        expect(body.current_version).toBe(2)
    })

    it('returns should_refresh: false when both media are null/empty', async () => {
        const client = buildMockClient({
            screen: { id: 'scr-5', refresh_version: 1 },
            resolvedMediaId: null, // rpc returns null
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(
            makeRequest({
                token: 'valid',
                knownVersion: '1',
                // knownMediaId omitted → ''
            })
        )
        const body = await res.json()

        // null → '' compared with '' → '' → no change
        expect(body.should_refresh).toBe(false)
    })

    // ----- Uses createAdminClient --------------------------------------

    it('calls createAdminClient (not createClient)', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await GET(makeRequest({ token: 'any' }))

        expect(createAdminClient).toHaveBeenCalled()
    })
})
