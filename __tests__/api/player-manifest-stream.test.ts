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

function makeRequest(params: Record<string, string> = {}) {
    const url = new URL('http://localhost/api/player/manifest')
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return new NextRequest(url)
}

const DEFAULT_SCREEN = {
    id: 'screen-001',
    store_id: 'store-001',
    refresh_version: 1,
    fit_mode: 'contain',
    screen_set_id: null,
    index_in_set: null,
    store: { client_id: 'client-001', timezone: 'Europe/London' },
    screen_set: null,
}

const DEFAULT_PLAN = { status: 'active', video_enabled: true }

const DEFAULT_STREAM = {
    id: 'stream-001',
    stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    stream_type: 'hls',
    audio_enabled: false,
    fallback_media_asset_id: null,
}

const STREAM_WITH_FALLBACK = {
    ...DEFAULT_STREAM,
    fallback_media_asset_id: 'media-fallback-001',
}

/**
 * Build a mock Supabase client configured for stream tests.
 *
 * The manifest route calls (when stream resolved):
 *   1. from('display_screens').select(...).eq(...).single()          → screen
 *   2. from('display_client_plans').select(...).eq(...).single()     → plan
 *   3. rpc('display_resolve_screen_content', ...)                    → resolved IDs
 *   4. from('display_streams').select(...).eq(...).single()          → stream
 *   5. (optional) from('display_media_assets').select(...).single()  → fallback media
 *   6. from('display_scheduled_screen_content').select(...).eq(...)  → schedules
 */
function buildStreamMockClient(opts: {
    screen?: any
    plan?: any
    streamId?: string | null
    stream?: any
    fallbackMedia?: any
    signedUrl?: string
    schedules?: any
}) {
    const {
        screen = DEFAULT_SCREEN,
        plan = DEFAULT_PLAN,
        streamId = 'stream-001',
        stream = DEFAULT_STREAM,
        fallbackMedia = null,
        signedUrl = 'https://signed.example.com/fallback.png',
        schedules = [],
    } = opts

    let fromCallIndex = 0

    const makeChain = (terminalData: any, resolveViaSingle = true) => {
        const chain: any = {}
        const passthrough = ['select', 'eq', 'neq', 'order', 'insert', 'update', 'delete', 'in']
        passthrough.forEach((m) => {
            chain[m] = vi.fn().mockReturnValue(chain)
        })
        if (resolveViaSingle) {
            chain.single = vi.fn().mockResolvedValue({ data: terminalData, error: null })
        } else {
            chain.then = vi.fn().mockImplementation((resolve: any) =>
                resolve({ data: terminalData, error: null })
            )
        }
        return chain
    }

    // Build from() chains based on what the route will call
    const fromChains: any[] = [
        makeChain(screen, true),    // display_screens
        makeChain(plan, true),      // display_client_plans
        makeChain(stream, true),    // display_streams (when stream resolved)
    ]

    // If stream has a fallback, the route will query display_media_assets for it
    if (fallbackMedia) {
        fromChains.push(makeChain(fallbackMedia, true))  // display_media_assets (fallback)
    }

    fromChains.push(makeChain(schedules, false))  // display_scheduled_screen_content

    const mockSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl },
    })

    const client: any = {
        from: vi.fn().mockImplementation(() => {
            const chain = fromChains[fromCallIndex] || makeChain(null, false)
            fromCallIndex++
            return chain
        }),

        rpc: vi.fn().mockResolvedValue({
            data: streamId
                ? [{ resolved_media_id: null, resolved_playlist_id: null, resolved_stream_id: streamId }]
                : [{ resolved_media_id: null, resolved_playlist_id: null, resolved_stream_id: null }],
            error: null,
        }),

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

describe('GET /api/player/manifest — Stream support', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(rateLimit as ReturnType<typeof vi.fn>).mockReturnValue(null)
    })

    // ----- Stream resolved ------------------------------------------------

    it('returns stream object when stream is resolved', async () => {
        const client = buildStreamMockClient({})
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'test-token' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.stream).toBeTruthy()
        expect(body.stream.id).toBe('stream-001')
        expect(body.stream.url).toBe('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')
        expect(body.stream.type).toBe('hls')
        expect(body.stream.audio_enabled).toBe(false)
        expect(body.stream.fallback_url).toBeNull()
    })

    it('returns stream with fallback URL when fallback media exists', async () => {
        const client = buildStreamMockClient({
            stream: STREAM_WITH_FALLBACK,
            fallbackMedia: { storage_path: 'client-001/fallback.png' },
            signedUrl: 'https://signed.example.com/fallback.png',
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'test-token' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.stream).toBeTruthy()
        expect(body.stream.fallback_url).toBe('https://signed.example.com/fallback.png')
    })

    it('returns null stream when no stream is resolved', async () => {
        const client = buildStreamMockClient({ streamId: null })
        // Override rpc to return no content at all
        client.rpc = vi.fn().mockResolvedValue({
            data: [{ resolved_media_id: null, resolved_playlist_id: null, resolved_stream_id: null }],
            error: null,
        })
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'test-token' }))
        expect(res.status).toBe(200)

        const body = await res.json()
        expect(body.stream).toBeNull()
    })

    it('returns null media and null playlist when stream is active', async () => {
        const client = buildStreamMockClient({})
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'test-token' }))
        const body = await res.json()

        expect(body.media.id).toBeNull()
        expect(body.media.url).toBeNull()
        expect(body.playlist).toBeNull()
        expect(body.stream).toBeTruthy()
    })

    it('preserves standard manifest fields with stream content', async () => {
        const client = buildStreamMockClient({})
        ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(client)

        const res = await GET(makeRequest({ token: 'test-token' }))
        const body = await res.json()

        expect(body.screen_id).toBe('screen-001')
        expect(body.refresh_version).toBe(1)
        expect(body.fit_mode).toBe('contain')
        expect(body.fetched_at).toBeTruthy()
    })
})
