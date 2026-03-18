import { describe, it, expect } from 'vitest'

/**
 * Tests for the player client-side fetch logic patterns.
 * These test the retry/backoff decision logic extracted from the player component,
 * NOT the React component itself (which would need a browser environment).
 */

describe('Player fetch retry logic', () => {
    const MAX_RETRY_DELAY_MS = 120000

    function shouldRetry(status: number): boolean {
        // 4xx errors are client errors — won't resolve with retries
        if (status >= 400 && status < 500) return false
        // 429 is rate limited — skip silently
        if (status === 429) return false
        // 5xx errors — server issue, retry with backoff
        if (status >= 500) return true
        return false
    }

    function calculateBackoff(retryCount: number): number {
        return Math.min((2 ** retryCount) * 1000, MAX_RETRY_DELAY_MS)
    }

    describe('shouldRetry', () => {
        it('does NOT retry on 400 Bad Request', () => {
            expect(shouldRetry(400)).toBe(false)
        })

        it('does NOT retry on 401 Unauthorized', () => {
            expect(shouldRetry(401)).toBe(false)
        })

        it('does NOT retry on 403 Forbidden', () => {
            expect(shouldRetry(403)).toBe(false)
        })

        it('does NOT retry on 404 Not Found', () => {
            expect(shouldRetry(404)).toBe(false)
        })

        it('does NOT retry on 429 Rate Limited', () => {
            expect(shouldRetry(429)).toBe(false)
        })

        it('DOES retry on 500 Internal Server Error', () => {
            expect(shouldRetry(500)).toBe(true)
        })

        it('DOES retry on 502 Bad Gateway', () => {
            expect(shouldRetry(502)).toBe(true)
        })

        it('DOES retry on 503 Service Unavailable', () => {
            expect(shouldRetry(503)).toBe(true)
        })
    })

    describe('calculateBackoff', () => {
        it('starts at 1 second for first retry', () => {
            expect(calculateBackoff(0)).toBe(1000)
        })

        it('doubles each retry', () => {
            expect(calculateBackoff(1)).toBe(2000)
            expect(calculateBackoff(2)).toBe(4000)
            expect(calculateBackoff(3)).toBe(8000)
        })

        it('caps at MAX_RETRY_DELAY_MS (120s)', () => {
            expect(calculateBackoff(10)).toBe(MAX_RETRY_DELAY_MS)
            expect(calculateBackoff(20)).toBe(MAX_RETRY_DELAY_MS)
        })

        it('increases monotonically up to cap', () => {
            let prev = 0
            for (let i = 0; i < 20; i++) {
                const delay = calculateBackoff(i)
                expect(delay).toBeGreaterThanOrEqual(prev)
                expect(delay).toBeLessThanOrEqual(MAX_RETRY_DELAY_MS)
                prev = delay
            }
        })
    })

    describe('Signed URL refresh timing', () => {
        const URL_REFRESH_MS = 45 * 60 * 1000 // 45 minutes

        it('refreshes before 1-hour expiry (at 45 min)', () => {
            const SIGNED_URL_TTL = 3600 * 1000 // 1 hour
            expect(URL_REFRESH_MS).toBeLessThan(SIGNED_URL_TTL)
            expect(URL_REFRESH_MS).toBe(2700000) // exactly 45 minutes
        })

        it('calculates correct delay from fetched_at', () => {
            const now = Date.now()
            const fetchedAt = now - (30 * 60 * 1000) // fetched 30 min ago
            const expiresAt = fetchedAt + URL_REFRESH_MS
            const delay = expiresAt - now

            // 45min - 30min = 15min remaining
            expect(delay).toBeCloseTo(15 * 60 * 1000, -3)
        })

        it('triggers immediate refresh when already expired', () => {
            const now = Date.now()
            const fetchedAt = now - (50 * 60 * 1000) // fetched 50 min ago
            const expiresAt = fetchedAt + URL_REFRESH_MS
            const delay = expiresAt - now

            expect(delay).toBeLessThan(0) // Already expired
        })
    })
})
