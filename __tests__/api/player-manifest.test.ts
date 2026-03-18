import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the route
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
    rateLimit: vi.fn().mockReturnValue(null),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

import { GET } from '@/app/api/player/manifest/route'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a NextRequest with query params. */
function makeRequest(params: Record<string, string> = {}) {
    const url = new URL('http://localhost/api/player/manifest')
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return new NextRequest(url)
}

/**
 * Build a mock Supabase client that returns different data for each
 * sequential `.from()` / `.rpc()` call.
 *
 * The manifest route calls:
 *   1. from('display_screens').select(...).eq(...).single()       → screen
 *   2. from('display_client_plans').select(...).eq(...).single()  → plan
 *   3. rpc('display_resolve_screen_media', ...)                   → mediaId
 *   4. from('display_media_assets').select(...).eq(...).single()  → media asset
 *   5. storage.from('onesign-display').createSignedUrl(...)       → signed URL
 *   6. from('display_scheduled_screen_content').select(...).eq(…) → schedules
 */
function buildMockClient(opts: {
    screen?: any
    plan?: any
    mediaId?: any
    mediaAsset?: any
    signedUrl?: string
    schedules?: any
}) {
    const {
        screen = null,
        plan = null,
        mediaId = null,
        mediaAsset = null,
        signedUrl = 'https://signed.example.com/file.png',
        schedules = [],
    } = opts

    // Track how many times .from() has been called so we can return
    // different chainable objects for each query.
    let fromCallIndex = 0

    const makeChain = (terminalData: any, resolveViaSingle = true) => {
        const chain: any = {}
        const passthrough = ['select', 'eq', 'neq', 'order', 'insert', 'update', 'delete']
        passthrough.forEach((m) => {
            chain[m] = vi.fn().mockReturnValue(chain)
        })
        if (resolveViaSingle) {
            chain.single = vi.fn().mockResolvedValue({ data: terminalData, error: null })
        } else {
            // For queries that don't use .single() — resolve when awaited
            chain.then = vi.fn().mockImplementation((resolve: any) =>
                resolve({ data: terminalData, error: null })
            )
        }
        return chain
    }

    // The four from() calls, in order:
    //   0 → display_screens        (single)
    //   1 → display_client_plans   (single)
    //   2 → display_media_assets   (single)   — only if mediaId
    //   3 → display_scheduled_screen_content   (no single — returns array)
    const fromChains = [
        makeChain(screen, true),           // display_screens
        makeChain(plan, true),             // display_client_plans
        makeChain(mediaAsset, true),       // display_media_assets
        makeChain(schedules, false),       // display_scheduled_screen_content
    ]

    const mockSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl },
    })

    const client: any = {
        from: vi.fn().mockImplementation(() => {
            const chain = fromChains[fromCallIndex] || makeChain(null, false)
            fromCallIndex++
            return chain
        }),

        rpc: vi.fn().mockResolvedValue({ data: mediaId, error: null }),

        storage: {
            from: vi.fn().mockReturnValue({
                createSignedUrl: mockSignedUrl,
            }),
        },
    }

    return client
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/player/manifest', () => {
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

    it('accepts a token of exactly 255 characters', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'a'.repeat(255) }))
        // Will be 401 (invalid token) but NOT 400 — that proves the length check passed
        expect(res.status).toBe(401)
    })

    // ----- Rate limiting -----------------------------------------------

    it('returns 429 when rate limited', async () => {
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue({ retryAfter: 30 })

        const res = await GET(makeRequest({ token: 'valid-token' }))
        expect(res.status).toBe(429)
        const body = await res.json()
        expect(body.error).toBe('Too many requests')
    })

    it('passes correct rate limit params', async () => {
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue({ retryAfter: 10 })

        await GET(makeRequest({ token: 'my-token' }))

        expect(rateLimit).toHaveBeenCalledWith('player-manifest', 'my-token', {
            maxRequests: 6,
            windowMs: 60000,
        })
    })

    // ----- Auth --------------------------------------------------------

    it('returns 401 for an invalid token (screen not found)', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'bad-token' }))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.error).toBe('Invalid token')
    })

    // ----- Paused / cancelled plan ------------------------------------

    it('returns 200 with null media when plan is paused', async () => {
        const client = buildMockClient({
            screen: {
                id: 'screen-1',
                store_id: 'store-1',
                refresh_version: 3,
                store: { client_id: 'client-1', timezone: 'Europe/London' },
            },
            plan: { status: 'paused', video_enabled: false },
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'paused-token' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.screen_id).toBe('screen-1')
        expect(body.media.id).toBeNull()
        expect(body.media.url).toBeNull()
        expect(body.media.type).toBeNull()
        expect(body.next_check).toBeDefined()
        expect(body.fetched_at).toBeDefined()
    })

    it('returns 200 with null media when plan is cancelled', async () => {
        const client = buildMockClient({
            screen: {
                id: 'screen-2',
                store_id: 'store-2',
                refresh_version: 1,
                store: { client_id: 'client-2', timezone: 'Europe/London' },
            },
            plan: { status: 'cancelled', video_enabled: false },
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'cancelled-token' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.media.id).toBeNull()
    })

    // ----- Active plan with media -------------------------------------

    it('returns 200 with signed media URL for active plan', async () => {
        const client = buildMockClient({
            screen: {
                id: 'screen-3',
                store_id: 'store-3',
                refresh_version: 5,
                store: { client_id: 'client-3', timezone: 'Europe/London' },
            },
            plan: { status: 'active', video_enabled: false },
            mediaId: 'media-42',
            mediaAsset: { storage_path: 'menus/lunch.png', mime: 'image/png' },
            signedUrl: 'https://storage.example.com/signed/lunch.png',
            schedules: [],
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'good-token' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.screen_id).toBe('screen-3')
        expect(body.refresh_version).toBe(5)
        expect(body.media.id).toBe('media-42')
        expect(body.media.url).toBe('https://storage.example.com/signed/lunch.png')
        expect(body.media.type).toBe('image/png')
        expect(body.fetched_at).toBeDefined()
    })

    // ----- Video gating -----------------------------------------------

    it('blocks video media when plan does not have video_enabled', async () => {
        const client = buildMockClient({
            screen: {
                id: 'screen-4',
                store_id: 'store-4',
                refresh_version: 1,
                store: { client_id: 'client-4', timezone: 'Europe/London' },
            },
            plan: { status: 'active', video_enabled: false },
            mediaId: 'vid-1',
            mediaAsset: { storage_path: 'menus/promo.mp4', mime: 'video/mp4' },
            schedules: [],
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'video-blocked' }))
        const body = await res.json()

        expect(body.media.url).toBeNull()
        expect(body.media.type).toBeNull()
    })

    it('allows video media when plan has video_enabled', async () => {
        const client = buildMockClient({
            screen: {
                id: 'screen-5',
                store_id: 'store-5',
                refresh_version: 1,
                store: { client_id: 'client-5', timezone: 'Europe/London' },
            },
            plan: { status: 'active', video_enabled: true },
            mediaId: 'vid-2',
            mediaAsset: { storage_path: 'menus/promo.mp4', mime: 'video/mp4' },
            signedUrl: 'https://storage.example.com/signed/promo.mp4',
            schedules: [],
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'video-ok' }))
        const body = await res.json()

        expect(body.media.url).toBe('https://storage.example.com/signed/promo.mp4')
        expect(body.media.type).toBe('video/mp4')
    })

    // ----- No plan defaults to active ---------------------------------

    it('treats missing plan as active with video disabled', async () => {
        const client = buildMockClient({
            screen: {
                id: 'screen-6',
                store_id: 'store-6',
                refresh_version: 1,
                store: { client_id: 'client-6', timezone: 'Europe/London' },
            },
            plan: null, // no plan row
            mediaId: 'img-1',
            mediaAsset: { storage_path: 'menus/default.jpg', mime: 'image/jpeg' },
            signedUrl: 'https://storage.example.com/signed/default.jpg',
            schedules: [],
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'no-plan' }))
        const body = await res.json()

        // Should be treated as active, so media is served
        expect(res.status).toBe(200)
        expect(body.media.url).toBe('https://storage.example.com/signed/default.jpg')
    })

    // ----- Uses createAdminClient (not createClient) ------------------

    it('calls createAdminClient (not createClient)', async () => {
        const client = buildMockClient({ screen: null })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        await GET(makeRequest({ token: 'any-token' }))

        expect(createAdminClient).toHaveBeenCalled()
    })
})
