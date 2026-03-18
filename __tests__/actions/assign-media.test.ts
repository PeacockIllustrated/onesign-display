import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock entitlements (dynamic import used by the action)
vi.mock('@/lib/auth/getEntitlements.server', () => ({
    getEntitlements: vi.fn().mockResolvedValue({ video_enabled: true }),
    assertEntitlement: vi.fn(),
}))

// Set up mock chain functions
const mockGetUser = vi.fn()

// We need a more flexible mock because assignMedia uses multiple from() calls
// with different table names and different chains
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSingle = vi.fn()
const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

// Track calls per table to return different data
let fromCallCount = 0
const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'display_screen_content') {
        return { update: mockUpdate, insert: mockInsert }
    }
    if (table === 'display_media_assets') {
        return {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { mime: 'image/png', client_id: 'client-1' }, error: null }),
                }),
            }),
        }
    }
    if (table === 'display_screens') {
        // For the update at the end (refresh_version bump)
        return {
            select: mockSelect,
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }
    }
    // display_profiles
    return { select: mockSelect }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockImplementation(async () => ({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
}))

import { assignMedia } from '@/app/actions/assign-media'

describe('assignMedia', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fromCallCount = 0
    })

    it('throws when unauthenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(assignMedia('screen-1', 'media-1')).rejects.toThrow('Unauthorized')
    })

    it('throws when screen not found', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        // Screen lookup returns null
        mockSingle.mockResolvedValueOnce({ data: null, error: null })

        await expect(assignMedia('screen-1', 'media-1')).rejects.toThrow('Screen not found')
    })

    it('throws Forbidden when client_admin tries to assign to another client screen', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        // Screen belongs to client-A
        mockSingle.mockResolvedValueOnce({
            data: { id: 'screen-1', refresh_version: 1, store: { client_id: 'client-A' } },
            error: null,
        })
        // Profile: client_admin for client-B
        mockSingle.mockResolvedValueOnce({
            data: { role: 'client_admin', client_id: 'client-B' },
            error: null,
        })

        await expect(assignMedia('screen-1', 'media-1')).rejects.toThrow('Forbidden')
    })

    it('allows super_admin to assign to any screen', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        // Screen belongs to client-A
        mockSingle.mockResolvedValueOnce({
            data: { id: 'screen-1', refresh_version: 1, store: { client_id: 'client-A' } },
            error: null,
        })
        // Profile: super_admin (no client_id)
        mockSingle.mockResolvedValueOnce({
            data: { role: 'super_admin', client_id: null },
            error: null,
        })

        // Should not throw
        await expect(assignMedia('screen-1', 'media-1')).resolves.toBeUndefined()
    })

    it('allows owner client_admin to assign to own screen', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        // Screen belongs to client-A
        mockSingle.mockResolvedValueOnce({
            data: { id: 'screen-1', refresh_version: 1, store: { client_id: 'client-A' } },
            error: null,
        })
        // Profile: client_admin for client-A (same client)
        mockSingle.mockResolvedValueOnce({
            data: { role: 'client_admin', client_id: 'client-A' },
            error: null,
        })

        await expect(assignMedia('screen-1', 'media-1')).resolves.toBeUndefined()
    })
})
