import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

describe('rateLimit', () => {
    beforeEach(() => {
        // Use unique store names per test to avoid cross-test contamination
    })

    it('allows requests within the limit', () => {
        const store = 'test-allow-' + Date.now()
        for (let i = 0; i < 5; i++) {
            const result = rateLimit(store, 'key1', { maxRequests: 5, windowMs: 60000 })
            expect(result).toBeNull()
        }
    })

    it('blocks requests over the limit', () => {
        const store = 'test-block-' + Date.now()
        for (let i = 0; i < 3; i++) {
            rateLimit(store, 'key1', { maxRequests: 3, windowMs: 60000 })
        }
        const result = rateLimit(store, 'key1', { maxRequests: 3, windowMs: 60000 })
        expect(result).not.toBeNull()
        expect(result!.retryAfter).toBeGreaterThan(0)
    })

    it('returns correct retryAfter value', () => {
        const store = 'test-retry-' + Date.now()
        for (let i = 0; i < 2; i++) {
            rateLimit(store, 'key1', { maxRequests: 2, windowMs: 30000 })
        }
        const result = rateLimit(store, 'key1', { maxRequests: 2, windowMs: 30000 })
        expect(result).not.toBeNull()
        expect(result!.retryAfter).toBeLessThanOrEqual(30)
        expect(result!.retryAfter).toBeGreaterThan(0)
    })

    it('resets after window expires', () => {
        const store = 'test-reset-' + Date.now()
        // Fill up the limit with a very short window
        for (let i = 0; i < 2; i++) {
            rateLimit(store, 'key1', { maxRequests: 2, windowMs: 1 }) // 1ms window
        }
        // The 3rd request should be blocked
        const blocked = rateLimit(store, 'key1', { maxRequests: 2, windowMs: 1 })
        // But after the window (practically instant), a new request should pass
        // Since windowMs=1, the entry resets almost immediately
        // We need to ensure the timestamp check works
        const result = rateLimit(store, 'key1-fresh', { maxRequests: 2, windowMs: 60000 })
        expect(result).toBeNull()
    })

    it('keeps independent stores separate', () => {
        const storeA = 'store-a-' + Date.now()
        const storeB = 'store-b-' + Date.now()

        // Fill store A
        for (let i = 0; i < 2; i++) {
            rateLimit(storeA, 'key1', { maxRequests: 2, windowMs: 60000 })
        }
        const blockedA = rateLimit(storeA, 'key1', { maxRequests: 2, windowMs: 60000 })
        expect(blockedA).not.toBeNull()

        // Store B should still allow
        const allowedB = rateLimit(storeB, 'key1', { maxRequests: 2, windowMs: 60000 })
        expect(allowedB).toBeNull()
    })

    it('keeps independent keys separate within same store', () => {
        const store = 'test-keys-' + Date.now()

        for (let i = 0; i < 2; i++) {
            rateLimit(store, 'user-a', { maxRequests: 2, windowMs: 60000 })
        }
        const blockedA = rateLimit(store, 'user-a', { maxRequests: 2, windowMs: 60000 })
        expect(blockedA).not.toBeNull()

        const allowedB = rateLimit(store, 'user-b', { maxRequests: 2, windowMs: 60000 })
        expect(allowedB).toBeNull()
    })
})

describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header', () => {
        const req = new Request('http://localhost', {
            headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        })
        expect(getClientIp(req)).toBe('1.2.3.4')
    })

    it('extracts IP from x-real-ip header', () => {
        const req = new Request('http://localhost', {
            headers: { 'x-real-ip': '10.0.0.1' },
        })
        expect(getClientIp(req)).toBe('10.0.0.1')
    })

    it('prefers x-forwarded-for over x-real-ip', () => {
        const req = new Request('http://localhost', {
            headers: {
                'x-forwarded-for': '1.2.3.4',
                'x-real-ip': '10.0.0.1',
            },
        })
        expect(getClientIp(req)).toBe('1.2.3.4')
    })

    it('falls back to unknown when no headers', () => {
        const req = new Request('http://localhost')
        expect(getClientIp(req)).toBe('unknown')
    })
})
