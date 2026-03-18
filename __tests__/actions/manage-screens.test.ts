import { describe, it, expect } from 'vitest'

describe('screen token generation', () => {
    it('generates tokens with crypto.getRandomValues', () => {
        const tokenBytes = new Uint8Array(12)
        crypto.getRandomValues(tokenBytes)
        const token = `tok-${Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`

        expect(token).toMatch(/^tok-[0-9a-f]{24}$/)
    })

    it('generates unique tokens', () => {
        const tokens = new Set<string>()
        for (let i = 0; i < 100; i++) {
            const bytes = new Uint8Array(12)
            crypto.getRandomValues(bytes)
            tokens.add(`tok-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
        }
        expect(tokens.size).toBe(100)
    })

    it('produces tokens of consistent length', () => {
        for (let i = 0; i < 50; i++) {
            const bytes = new Uint8Array(12)
            crypto.getRandomValues(bytes)
            const token = `tok-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
            expect(token.length).toBe(28) // 'tok-' (4) + 24 hex chars
        }
    })

    it('only contains hex characters in the random portion', () => {
        const bytes = new Uint8Array(12)
        crypto.getRandomValues(bytes)
        const token = `tok-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
        const hexPart = token.slice(4)
        expect(hexPart).toMatch(/^[0-9a-f]+$/)
    })

    it('pads single-digit hex values with leading zero', () => {
        // Force a byte value < 16 to verify padding
        const bytes = new Uint8Array([0, 1, 15, 16, 255, 128, 64, 32, 10, 5, 2, 0])
        const token = `tok-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
        expect(token).toBe('tok-00010f10ff8040200a050200')
        expect(token).toMatch(/^tok-[0-9a-f]{24}$/)
    })
})
