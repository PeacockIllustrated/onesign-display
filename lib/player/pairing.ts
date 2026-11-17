/**
 * Short-code pairing helpers.
 *
 * Codes use an alphabet without look-alike characters (no 0/O, 1/I/L), so a
 * code read off a TV across a room can be typed without mistakes. Six
 * characters from 31 symbols is ~887 million combinations; codes expire in
 * ten minutes and only pair once, so guessing one is not a practical attack.
 */

export const PAIRING_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const PAIRING_TTL_MS = 10 * 60 * 1000

export function generatePairingCode(): string {
    const bytes = new Uint8Array(6)
    crypto.getRandomValues(bytes)
    let out = ''
    for (const b of bytes) out += PAIRING_ALPHABET[b % PAIRING_ALPHABET.length]
    return out
}

/** "k7q 29p", "K7Q-29P" and "k7q29p" all become "K7Q29P". Returns null if it can't be a code. */
export function normalisePairingCode(input: string | null | undefined): string | null {
    if (!input) return null
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
        .replace(/O/g, '0').replace(/[IL]/g, '1')
    // After mapping look-alikes, any 0 or 1 means the code was mistyped.
    if (cleaned.length !== 6 || /[01]/.test(cleaned)) return null
    for (const ch of cleaned) if (!PAIRING_ALPHABET.includes(ch)) return null
    return cleaned
}

export function formatPairingCode(code: string): string {
    return `${code.slice(0, 3)}-${code.slice(3)}`
}
