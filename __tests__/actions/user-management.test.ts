import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Set up mock functions
const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockProfileSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockProfileSingle }) })
const mockFrom = vi.fn().mockReturnValue({ select: mockProfileSelect, insert: vi.fn() })

const mockAdminCreateUser = vi.fn()
const mockAdminDeleteUser = vi.fn()
const mockAdminInsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockImplementation(async () => ({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
    createAdminClient: vi.fn().mockImplementation(async () => ({
        auth: {
            admin: {
                createUser: mockAdminCreateUser,
                deleteUser: mockAdminDeleteUser,
            },
        },
        from: vi.fn().mockReturnValue({
            insert: mockAdminInsert,
        }),
    })),
}))

import { createUserForClient } from '@/app/actions/user-management'

describe('createUserForClient', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // --- Auth checks ---

    it('returns Unauthorized when not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')
        expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('returns Unauthorized when not super_admin', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'client_admin' }, error: null })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')
        expect(result).toEqual({ error: 'Unauthorized: Super Admin only' })
    })

    // --- Input validation ---

    it('rejects invalid email without @', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })

        const result = await createUserForClient('client-1', 'not-an-email', 'Test User')
        expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('rejects empty email', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })

        const result = await createUserForClient('client-1', '', 'Test User')
        expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('rejects name longer than 255 characters', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })

        const longName = 'A'.repeat(256)
        const result = await createUserForClient('client-1', 'test@example.com', longName)
        expect(result).toEqual({ error: 'Invalid name' })
    })

    it('rejects empty name', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })

        const result = await createUserForClient('client-1', 'test@example.com', '')
        expect(result).toEqual({ error: 'Invalid name' })
    })

    it('rejects missing clientId', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })

        const result = await createUserForClient('', 'test@example.com', 'Test User')
        expect(result).toEqual({ error: 'Client ID is required' })
    })

    // --- Password generation ---

    it('generates a 32-character hex temporary password', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })
        mockAdminCreateUser.mockResolvedValue({
            data: { user: { id: 'new-user-1' } },
            error: null,
        })
        mockAdminInsert.mockResolvedValue({ error: null })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')

        expect(result.temporaryPassword).toBeDefined()
        expect(result.temporaryPassword).toMatch(/^[0-9a-f]{32}$/)
    })

    it('does not use "password123" as the temporary password', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })
        mockAdminCreateUser.mockResolvedValue({
            data: { user: { id: 'new-user-1' } },
            error: null,
        })
        mockAdminInsert.mockResolvedValue({ error: null })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')

        expect(result.temporaryPassword).not.toBe('password123')
    })

    // --- Success case ---

    it('returns userId on successful creation', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })
        mockAdminCreateUser.mockResolvedValue({
            data: { user: { id: 'new-user-1' } },
            error: null,
        })
        mockAdminInsert.mockResolvedValue({ error: null })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')

        expect(result.success).toBe(true)
        expect(result.userId).toBe('new-user-1')
    })

    // --- Error handling ---

    it('returns a generic error message on auth creation failure', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })
        mockAdminCreateUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Internal: database connection reset at row 42' },
        })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')

        // Should NOT leak the internal error message
        expect(result.error).toBe('Failed to create user. Please try again.')
        expect(result.error).not.toContain('database')
    })

    it('rolls back auth user when profile creation fails', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockProfileSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null })
        mockAdminCreateUser.mockResolvedValue({
            data: { user: { id: 'new-user-1' } },
            error: null,
        })
        mockAdminInsert.mockResolvedValue({
            error: { message: 'duplicate key' },
        })

        const result = await createUserForClient('client-1', 'test@example.com', 'Test User')

        expect(result.error).toBe('Failed to create user profile. Please try again.')
        expect(mockAdminDeleteUser).toHaveBeenCalledWith('new-user-1')
    })
})
