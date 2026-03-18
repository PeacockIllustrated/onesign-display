import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
        const res = await GET()
        expect(res.status).toBe(200)

        const data = await res.json()
        expect(data.status).toBe('ok')
    })

    it('returns a valid ISO timestamp', async () => {
        const res = await GET()
        const data = await res.json()

        expect(data.timestamp).toBeDefined()
        const parsed = new Date(data.timestamp)
        expect(parsed.getTime()).not.toBeNaN()
    })
})
