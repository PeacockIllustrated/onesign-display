import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('test-uuid-1234'),
}))

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}))

import { POST } from '@/app/api/upload/ingest/route'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Build a mock session client (createClient) that handles:
 *   1. auth.getUser()
 *   2. from('display_profiles').select().eq().single()  — profile lookup
 *   3. from('display_media_assets').insert().select().single()  — asset insert
 *   4+ further from() calls for screen_content / screens  — batch logic
 */
function mockSessionClient(opts: {
    user?: { id: string } | null
    profile?: { role: string; client_id: string } | null
    assetInsert?: { data: any; error: any }
} = {}) {
    const {
        user = { id: 'user-1' },
        profile = { role: 'super_admin', client_id: 'client-1' },
        assetInsert = { data: { id: 'asset-1' }, error: null },
    } = opts

    // Each from() call returns a fresh mini-chain so independent queries don't collide.
    const fromFn = vi.fn().mockImplementation((table: string) => {
        const chain: any = {}
        const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order']
        chainMethods.forEach(m => { chain[m] = vi.fn().mockReturnValue(chain) })

        if (table === 'display_profiles') {
            chain.single = vi.fn().mockResolvedValue({ data: profile, error: null })
        } else if (table === 'display_media_assets') {
            chain.single = vi.fn().mockResolvedValue(assetInsert)
        } else {
            // display_screen_content, display_screens, etc.
            chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }

        return chain
    })

    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user },
                error: user ? null : { message: 'No session' },
            }),
        },
        from: fromFn,
    }
}

function mockAdminStorage(uploadError: any = null) {
    return {
        from: vi.fn(),
        auth: { getUser: vi.fn() },
        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn().mockResolvedValue({ data: {}, error: uploadError }),
                getPublicUrl: vi.fn().mockReturnValue({
                    data: { publicUrl: 'https://public.url/file.jpg' },
                }),
            }),
        },
    }
}

function makeUploadRequest(files: File[], clientId?: string, storeId?: string) {
    const formData = new FormData()
    if (clientId) formData.append('clientId', clientId)
    if (storeId) formData.append('storeId', storeId)
    files.forEach(f => formData.append('files', f))

    return new NextRequest('http://localhost/api/upload/ingest', {
        method: 'POST',
        body: formData,
    })
}

describe('POST /api/upload/ingest', () => {
    const originalEnv = process.env.SUPABASE_SERVICE_ROLE_KEY

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

        const sessionClient = mockSessionClient()
        vi.mocked(createClient).mockResolvedValue(sessionClient as any)

        const adminClient = mockAdminStorage()
        vi.mocked(createAdminClient).mockResolvedValue(adminClient as any)
    })

    afterAll(() => {
        if (originalEnv === undefined) {
            delete process.env.SUPABASE_SERVICE_ROLE_KEY
        } else {
            process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv
        }
    })

    // ── Auth: unauthenticated ───────────────────────────────────────
    it('returns 401 when user is not authenticated', async () => {
        vi.mocked(createClient).mockResolvedValue(
            mockSessionClient({ user: null }) as any
        )

        const file = new File(['x'], 'pic.jpg', { type: 'image/jpeg' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(401)

        const data = await res.json()
        expect(data.error).toBe('Unauthorized')
    })

    // ── Missing files ───────────────────────────────────────────────
    it('returns 400 when no files are provided', async () => {
        const res = await POST(makeUploadRequest([], 'client-1'))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.error).toMatch(/missing files/i)
    })

    // ── Missing clientId ────────────────────────────────────────────
    it('returns 400 when clientId is missing', async () => {
        const file = new File(['x'], 'pic.jpg', { type: 'image/jpeg' })
        const res = await POST(makeUploadRequest([file]))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.error).toMatch(/missing files or clientId/i)
    })

    // ── Too many files ──────────────────────────────────────────────
    it('returns 400 when more than 20 files are uploaded', async () => {
        const files = Array.from({ length: 21 }, (_, i) =>
            new File(['x'], `file-${i}.jpg`, { type: 'image/jpeg' })
        )
        const res = await POST(makeUploadRequest(files, 'client-1'))
        expect(res.status).toBe(400)

        const data = await res.json()
        expect(data.error).toMatch(/max 20 files/i)
    })

    // ── Wrong client (client_admin for different client) ────────────
    it('returns 403 when client_admin uploads to a different client', async () => {
        vi.mocked(createClient).mockResolvedValue(
            mockSessionClient({
                profile: { role: 'client_admin', client_id: 'client-OTHER' },
            }) as any
        )

        const file = new File(['x'], 'pic.jpg', { type: 'image/jpeg' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(403)

        const data = await res.json()
        expect(data.error).toMatch(/forbidden/i)
    })

    // ── client_admin uploads to own client → allowed ────────────────
    it('allows client_admin to upload to their own client', async () => {
        vi.mocked(createClient).mockResolvedValue(
            mockSessionClient({
                profile: { role: 'client_admin', client_id: 'client-1' },
            }) as any
        )

        const file = new File(['img'], 'pic.jpg', { type: 'image/jpeg' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.success).toBe(true)
    })

    // ── Super admin can upload to any client ────────────────────────
    it('allows super_admin to upload to any client', async () => {
        vi.mocked(createClient).mockResolvedValue(
            mockSessionClient({
                profile: { role: 'super_admin', client_id: 'client-999' },
            }) as any
        )

        const file = new File(['img'], 'pic.png', { type: 'image/png' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.success).toBe(true)
    })

    // ── Invalid MIME type rejected in results ───────────────────────
    it('rejects files with invalid MIME types in the results array', async () => {
        const file = new File(['data'], 'hack.exe', { type: 'application/x-msdownload' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.results).toHaveLength(1)
        expect(data.results[0].status).toBe('rejected')
        expect(data.results[0].error).toMatch(/unsupported file type/i)
    })

    // ── All valid MIME types are accepted ────────────────────────────
    it.each([
        ['image/jpeg', 'photo.jpg'],
        ['image/png', 'photo.png'],
        ['image/webp', 'photo.webp'],
        ['image/gif', 'anim.gif'],
        ['video/mp4', 'clip.mp4'],
        ['video/quicktime', 'clip.mov'],
    ])('accepts MIME type %s', async (mime, filename) => {
        const file = new File(['content'], filename, { type: mime })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.results[0].status).not.toBe('rejected')
    })

    // ── Extension derived from MIME, not filename ───────────────────
    it('derives storage extension from MIME type, not the original filename', async () => {
        const adminClient = mockAdminStorage()
        vi.mocked(createAdminClient).mockResolvedValue(adminClient as any)

        // File has .txt extension but MIME is image/png → should store as .png
        const file = new File(['img'], 'sneaky.txt', { type: 'image/png' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(200)

        const storageBucket = adminClient.storage.from('onesign-display')
        const uploadCall = storageBucket.upload.mock.calls[0]
        const storagePath: string = uploadCall[0]
        expect(storagePath).toMatch(/\.png$/)
        expect(storagePath).not.toMatch(/\.txt/)
    })

    // ── Mixed valid and invalid files ───────────────────────────────
    it('processes a mix of valid and invalid files correctly', async () => {
        const validFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
        const invalidFile = new File(['doc'], 'doc.pdf', { type: 'application/pdf' })

        const res = await POST(makeUploadRequest([validFile, invalidFile], 'client-1'))
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.results).toHaveLength(2)

        const uploaded = data.results.find((r: any) => r.file === 'photo.jpg')
        const rejected = data.results.find((r: any) => r.file === 'doc.pdf')

        expect(uploaded.status).toBe('uploaded')
        expect(rejected.status).toBe('rejected')
    })

    // ── Profile not found → 403 ─────────────────────────────────────
    it('returns 403 when user profile is not found', async () => {
        vi.mocked(createClient).mockResolvedValue(
            mockSessionClient({ profile: null }) as any
        )

        const file = new File(['x'], 'pic.jpg', { type: 'image/jpeg' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(403)

        const data = await res.json()
        expect(data.error).toMatch(/profile not found/i)
    })

    // ── Missing service role key → 500 ──────────────────────────────
    it('returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY

        const file = new File(['x'], 'pic.jpg', { type: 'image/jpeg' })
        const res = await POST(makeUploadRequest([file], 'client-1'))
        expect(res.status).toBe(500)

        const data = await res.json()
        expect(data.error).toMatch(/server configuration/i)
    })
})
