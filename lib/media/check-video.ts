/**
 * Checks a video in the browser before upload and lists anything a typical
 * TV or Screens Player box may fail to play. Nothing is converted here; the
 * uploader shows the issues and lets the person cancel or carry on.
 *
 * What we look for (the usual reasons a menu video shows black on a TV):
 *  - codec: HEVC/H.265 (iPhone default), ProRes, AV1 or VP9 instead of H.264
 *  - size above 1080p (4K files) or a high frame rate
 *  - bitrate above ~12 Mbps
 *  - a .mov container
 */

export interface VideoCheck {
    codec: string | null
    width: number | null
    height: number | null
    duration: number | null
    bitrateMbps: number | null
    issues: string[]
}

const CODECS: [string, string][] = [
    ['avc1', 'H.264'], ['avc3', 'H.264'],
    ['hvc1', 'HEVC (H.265)'], ['hev1', 'HEVC (H.265)'],
    ['av01', 'AV1'], ['vp09', 'VP9'], ['vp08', 'VP8'],
    ['apch', 'ProRes'], ['apcn', 'ProRes'], ['apcs', 'ProRes'], ['apco', 'ProRes'], ['ap4h', 'ProRes'],
]
const MAX_BITRATE_MBPS = 12

async function readBytes(file: Blob, start: number, end: number): Promise<Uint8Array> {
    return new Uint8Array(await file.slice(start, end).arrayBuffer())
}

/** Walk the top-level MP4/MOV boxes to find 'moov', then look for a sample-entry fourcc inside it. */
async function findCodec(file: File): Promise<string | null> {
    let offset = 0
    for (let guard = 0; guard < 64 && offset + 8 <= file.size; guard++) {
        const head = await readBytes(file, offset, offset + 16)
        const view = new DataView(head.buffer)
        let size = view.getUint32(0)
        const type = String.fromCharCode(head[4], head[5], head[6], head[7])
        if (size === 1 && head.length >= 16) size = Number(view.getBigUint64(8))
        else if (size === 0) size = file.size - offset
        if (size < 8) return null
        if (type === 'moov') {
            const moov = await readBytes(file, offset, Math.min(offset + size, offset + 32 * 1024 * 1024))
            const text = new TextDecoder('latin1').decode(moov)
            for (const [fourcc, name] of CODECS) if (text.includes(fourcc)) return name
            return null
        }
        offset += size
    }
    return null
}

function readMetadata(file: File): Promise<{ width: number, height: number, duration: number } | null> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const video = document.createElement('video')
        const done = (v: { width: number, height: number, duration: number } | null) => {
            URL.revokeObjectURL(url)
            resolve(v)
        }
        const timer = setTimeout(() => done(null), 8000)
        video.preload = 'metadata'
        video.muted = true
        video.onloadedmetadata = () => {
            clearTimeout(timer)
            done({ width: video.videoWidth, height: video.videoHeight, duration: video.duration })
        }
        video.onerror = () => { clearTimeout(timer); done(null) }
        video.src = url
    })
}

export async function checkVideo(file: File): Promise<VideoCheck> {
    const issues: string[] = []
    const [codec, meta] = await Promise.all([
        findCodec(file).catch(() => null),
        readMetadata(file),
    ])

    if (codec && codec !== 'H.264') {
        issues.push(`It's encoded as ${codec}. Many TVs only play H.264, so it may show as a black screen.`)
    }
    if (!meta) {
        issues.push('This browser can’t read the video, which often means TVs can’t either.')
    }
    const width = meta?.width || null
    const height = meta?.height || null
    if (width && height && Math.max(width, height) > 1920) {
        issues.push(`It's ${width}×${height}. Anything above 1080p (1920×1080) can stutter or fail on TVs.`)
    }
    const duration = meta?.duration && Number.isFinite(meta.duration) ? meta.duration : null
    const bitrateMbps = duration ? (file.size * 8) / duration / 1_000_000 : null
    if (bitrateMbps && bitrateMbps > MAX_BITRATE_MBPS) {
        issues.push(`It's about ${bitrateMbps.toFixed(0)} Mbps. Over ${MAX_BITRATE_MBPS} Mbps can stutter on TVs and slow downloads.`)
    }
    if (/\.mov$/i.test(file.name) && (!codec || codec !== 'H.264')) {
        issues.push('It’s a .mov file. An .mp4 is the safest choice for TVs.')
    }

    return { codec, width, height, duration, bitrateMbps, issues }
}

/** Ask before uploading videos with problems. Returns false if the person cancels. */
export async function confirmVideoUpload(file: File): Promise<boolean> {
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm)$/i.test(file.name)) return true
    const result = await checkVideo(file)
    if (result.issues.length === 0) return true
    return window.confirm(
        `${file.name} may not play on every screen:\n\n• ${result.issues.join('\n• ')}\n\n` +
        `For the best results, export it as an H.264 .mp4 at 1920×1080, around 8 Mbps.\n\nUpload it anyway?`
    )
}
