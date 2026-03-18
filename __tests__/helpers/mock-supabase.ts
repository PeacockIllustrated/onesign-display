import { vi } from 'vitest'

/**
 * Creates a chainable mock Supabase client for testing.
 * Each method returns `this` for chaining, with .single() and terminal methods
 * resolving the configured response.
 */
export function createMockSupabaseClient(overrides: Record<string, any> = {}) {
    const chainable: any = {
        _response: { data: null, error: null },

        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),

        single: vi.fn().mockImplementation(function (this: any) {
            return Promise.resolve(this._response)
        }),

        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),

        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: null,
            }),
            admin: {
                createUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
                deleteUser: vi.fn().mockResolvedValue({ error: null }),
            },
        },

        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
                createSignedUrl: vi.fn().mockResolvedValue({
                    data: { signedUrl: 'https://signed.example.com/file.png' },
                }),
                getPublicUrl: vi.fn().mockReturnValue({
                    data: { publicUrl: 'https://public.example.com/file.png' },
                }),
            }),
        },

        ...overrides,
    }

    // Helper: configure what the next chain returns
    chainable.mockResponse = (data: any, error: any = null) => {
        chainable._response = { data, error }
        // Also make single() return this
        chainable.single.mockImplementation(() => Promise.resolve({ data, error }))
        return chainable
    }

    // Make non-single terminal calls return the response too
    chainable.then = undefined // Prevent auto-thenable

    return chainable
}

/**
 * Helper to create NextRequest for API route testing
 */
export function mockRequest(url: string, options?: RequestInit) {
    // NextRequest is from 'next/server' which may not be available in test env
    // Use standard Request as a stand-in
    return new Request(url, options)
}
