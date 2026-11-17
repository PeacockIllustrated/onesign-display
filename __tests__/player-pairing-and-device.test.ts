import { describe, it, expect } from 'vitest'
import { generatePairingCode, normalisePairingCode, formatPairingCode, PAIRING_ALPHABET } from '@/lib/player/pairing'
import { describeDevice } from '@/lib/player/describe-device'

describe('pairing codes', () => {
    it('generates six characters from the unambiguous alphabet', () => {
        for (let i = 0; i < 200; i++) {
            const code = generatePairingCode()
            expect(code).toHaveLength(6)
            for (const ch of code) expect(PAIRING_ALPHABET).toContain(ch)
        }
    })

    it('accepts the code however it is typed', () => {
        expect(normalisePairingCode('k7q-29p')).toBe('K7Q29P')
        expect(normalisePairingCode(' K7Q 29P ')).toBe('K7Q29P')
        expect(formatPairingCode('K7Q29P')).toBe('K7Q-29P')
    })

    it('rejects codes that cannot exist', () => {
        expect(normalisePairingCode('')).toBeNull()
        expect(normalisePairingCode('K7Q29')).toBeNull()
        expect(normalisePairingCode('K7O29P')).toBeNull() // O is never issued
        expect(normalisePairingCode('K7Q29PX')).toBeNull()
    })
})

describe('describeDevice', () => {
    it('rates a modern Fully Kiosk stick as good', () => {
        const d = describeDevice('Mozilla/5.0 (Linux; Android 11; H96 Max) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Fully/1.55')
        expect(d.verdict).toBe('good')
        expect(d.label).toBe('Fully Kiosk Chromium 126 on Android')
    })

    it('flags an old Tizen browser as at risk', () => {
        const d = describeDevice('Mozilla/5.0 (SMART-TV; Linux; Tizen 3.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/3.0 TV Safari/537.36')
        expect(d.platform).toBe('Samsung Tizen')
        expect(d.verdict).toBe('struggling')
    })

    it('rates old Chromium on webOS as struggling', () => {
        const d = describeDevice('Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager')
        expect(d.platform).toBe('LG webOS')
        expect(d.verdict).toBe('struggling')
    })

    it('handles a missing user agent', () => {
        expect(describeDevice(null).verdict).toBe('unknown')
    })
})
