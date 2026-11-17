/**
 * Turns a player's user agent into a short, human label for the portal,
 * plus a rough verdict on whether that browser can run the player well.
 *
 * Deliberately simple: we only need to tell "Fully Kiosk on a Chromium 120
 * stick" apart from "2016 Samsung Tizen browser", not to identify every device.
 */

export type DeviceVerdict = 'good' | 'ok' | 'struggling' | 'unknown'

export interface DeviceDescription {
    label: string
    platform: string | null
    engine: string | null
    engine_version: number | null
    verdict: DeviceVerdict
    note: string | null
}

// Oldest Chromium we trust with the player (modern CSS, ES2020, Wake Lock).
const CHROMIUM_GOOD = 100
const CHROMIUM_OK = 87

function match(ua: string, re: RegExp): string | null {
    const m = ua.match(re)
    return m ? m[1] : null
}

export function describeDevice(ua: string | null | undefined): DeviceDescription {
    if (!ua) {
        return { label: 'Unknown device', platform: null, engine: null, engine_version: null, verdict: 'unknown', note: null }
    }

    let platform: string | null = null
    if (/Web0S|webOS/i.test(ua)) platform = 'LG webOS'
    else if (/Tizen/i.test(ua)) platform = 'Samsung Tizen'
    else if (/BRAVIA/i.test(ua)) platform = 'Sony Bravia'
    else if (/CrKey/i.test(ua)) platform = 'Chromecast'
    else if (/AFT[A-Z]/.test(ua)) platform = 'Fire TV'
    else if (/Android/i.test(ua)) platform = 'Android'
    else if (/CrOS/i.test(ua)) platform = 'ChromeOS'
    else if (/Windows/i.test(ua)) platform = 'Windows'
    else if (/Macintosh|Mac OS X/i.test(ua)) platform = /iPad|iPhone/.test(ua) ? 'iOS' : 'Mac'
    else if (/Linux/i.test(ua)) platform = 'Linux'

    const fully = /Fully|FKB/i.test(ua)
    const chromium = match(ua, /Chrom(?:e|ium)\/(\d+)/)
    const firefox = match(ua, /Firefox\/(\d+)/)
    const safari = !chromium && !firefox ? match(ua, /Version\/(\d+)[^ ]* .*Safari/) : null

    let engine: string | null = null
    let version: number | null = null
    if (chromium) { engine = 'Chromium'; version = Number(chromium) }
    else if (firefox) { engine = 'Firefox'; version = Number(firefox) }
    else if (safari) { engine = 'Safari'; version = Number(safari) }

    let verdict: DeviceVerdict = 'unknown'
    let note: string | null = null
    if (engine === 'Chromium' && version !== null) {
        if (version >= CHROMIUM_GOOD) verdict = 'good'
        else if (version >= CHROMIUM_OK) { verdict = 'ok'; note = 'Older browser. Works, but consider a Screens Player box.' }
        else { verdict = 'struggling'; note = 'Browser too old for reliable playback. Swap for a Screens Player box.' }
    } else if (engine === 'Safari' && version !== null) {
        verdict = version >= 15 ? 'good' : 'struggling'
        if (verdict === 'struggling') note = 'Old Safari. Expect layout or video problems.'
    } else if (engine === 'Firefox' && version !== null) {
        verdict = version >= 100 ? 'good' : 'ok'
    } else if (platform === 'Samsung Tizen' || platform === 'LG webOS') {
        verdict = 'struggling'
        note = 'TV browser with no version information. Watch this screen closely.'
    }

    const parts = [fully ? 'Fully Kiosk' : null, engine && version ? `${engine} ${version}` : engine, platform ? `on ${platform}` : null]
    const label = parts.filter(Boolean).join(' ') || 'Unknown device'

    return { label, platform, engine, engine_version: version, verdict, note }
}
