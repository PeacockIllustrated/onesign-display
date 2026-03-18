import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache and next/navigation before importing the action
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn().mockImplementation((url: string) => {
        throw new Error(`REDIRECT:${url}`)
    }),
}))

// Mock supabase client
const mockSingle = vi.fn()
const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn() }) }) })
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockImplementation(async () => ({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    })),
}))

import { createSchedule } from '@/app/actions/create-schedule'

function makeFormData(fields: Record<string, string | string[]>): FormData {
    const fd = new FormData()
    for (const [key, value] of Object.entries(fields)) {
        if (Array.isArray(value)) {
            value.forEach(v => fd.append(key, v))
        } else {
            fd.set(key, value)
        }
    }
    return fd
}

describe('createSchedule', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    })

    // --- Required field validation ---

    it('throws on missing storeId', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '11:00', endTime: '14:00', days: ['1', '2'] })
        await expect(createSchedule('', fd)).rejects.toThrow('Missing required fields')
    })

    it('throws on missing name', async () => {
        const fd = makeFormData({ startTime: '11:00', endTime: '14:00', days: ['1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Missing required fields')
    })

    it('throws on missing startTime', async () => {
        const fd = makeFormData({ name: 'Lunch', endTime: '14:00', days: ['1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Missing required fields')
    })

    it('throws on missing endTime', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '11:00', days: ['1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Missing required fields')
    })

    it('throws when no days selected', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '11:00', endTime: '14:00' })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Missing required fields')
    })

    // --- Time format validation ---

    it('accepts "25:00" because regex only checks format not semantic validity', async () => {
        // The pattern /^\d{2}:\d{2}(:\d{2})?$/ matches '25:00' — it checks format, not range
        const fd = makeFormData({ name: 'Lunch', startTime: '25:00', endTime: '14:00', days: ['1'] })
        mockGetUser.mockResolvedValue({ data: { user: null } })
        // Passes time validation, hits auth check next
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Unauthorized')
    })

    it('throws on invalid time format "abc"', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: 'abc', endTime: '14:00', days: ['1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Invalid time format')
    })

    it('throws on invalid time format "9:30"', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '9:30', endTime: '14:00', days: ['1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Invalid time format')
    })

    it('throws on invalid time format "12:5"', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '12:5', endTime: '14:00', days: ['1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Invalid time format')
    })

    it('accepts valid time "09:30"', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:30', endTime: '14:00', days: ['1'] })
        // Will pass time validation, then hit auth check
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Unauthorized')
    })

    it('accepts valid time with seconds "09:30:00"', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:30:00', endTime: '14:00:00', days: ['1'] })
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Unauthorized')
    })

    // --- Day validation ---

    it('throws on day value 7', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:00', endTime: '14:00', days: ['7'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Invalid day values')
    })

    it('throws on day value -1', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:00', endTime: '14:00', days: ['-1'] })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Invalid day values')
    })

    it('accepts day values 0 through 6', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:00', endTime: '14:00', days: ['0', '1', '2', '3', '4', '5', '6'] })
        mockGetUser.mockResolvedValue({ data: { user: null } })
        // Passes day validation, hits auth
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Unauthorized')
    })

    // --- Auth and ownership ---

    it('throws when unauthenticated', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:00', endTime: '14:00', days: ['1'] })
        mockGetUser.mockResolvedValue({ data: { user: null } })
        await expect(createSchedule('store-1', fd)).rejects.toThrow('Unauthorized')
    })

    it('throws when store not found', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:00', endTime: '14:00', days: ['1'] })
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

        // First from().select().eq().single() is the store lookup
        mockSingle.mockResolvedValueOnce({ data: null, error: null })

        await expect(createSchedule('store-1', fd)).rejects.toThrow('Store not found')
    })

    it('throws when user does not own the store', async () => {
        const fd = makeFormData({ name: 'Lunch', startTime: '09:00', endTime: '14:00', days: ['1'] })
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

        // Store lookup returns a store with client_id 'client-A'
        mockSingle.mockResolvedValueOnce({ data: { id: 'store-1', client_id: 'client-A' }, error: null })
        // Profile lookup returns client_admin for client-B
        mockSingle.mockResolvedValueOnce({ data: { role: 'client_admin', client_id: 'client-B' }, error: null })

        await expect(createSchedule('store-1', fd)).rejects.toThrow('Forbidden')
    })
})
