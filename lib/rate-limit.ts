/**
 * Lightweight in-memory rate limiter.
 * No external dependencies — uses a Map with automatic cleanup.
 *
 * Token-based for player routes (avoids NAT/shared-IP false positives).
 * IP-based for public form routes (prevents spam).
 */

type RateLimitEntry = {
    count: number
    resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
    let store = stores.get(name)
    if (!store) {
        store = new Map()
        stores.set(name, store)
    }
    return store
}

/**
 * Check if a key is rate limited.
 * @returns null if allowed, or { retryAfter: seconds } if blocked.
 */
export function rateLimit(
    storeName: string,
    key: string,
    opts: { maxRequests: number; windowMs: number }
): { retryAfter: number } | null {
    const store = getStore(storeName)
    const now = Date.now()

    // Periodic cleanup: evict expired entries every 100 checks
    if (store.size > 0 && store.size % 100 === 0) {
        for (const [k, v] of store) {
            if (now > v.resetAt) store.delete(k)
        }
    }

    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs })
        return null
    }

    entry.count++

    if (entry.count > opts.maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return { retryAfter }
    }

    return null
}

/** Get client IP from request headers (works behind proxies) */
export function getClientIp(request: Request): string {
    const headers = request.headers
    return (
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        'unknown'
    )
}
