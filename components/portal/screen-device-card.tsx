import type { DeviceVerdict } from '@/lib/player/describe-device'

type PlayerInfo = {
    label?: string
    verdict?: DeviceVerdict
    note?: string | null
    viewport?: string | null
    screen?: string | null
    memory_gb?: number | null
    offline_cache?: boolean
    wake_lock?: boolean
    reported_at?: string
} | null

const VERDICT: Record<DeviceVerdict, { text: string; cls: string }> = {
    good: { text: 'Good', cls: 'bg-teal-100 text-teal-800' },
    ok: { text: 'OK', cls: 'bg-amber-100 text-amber-800' },
    struggling: { text: 'At risk', cls: 'bg-red-100 text-red-700' },
    unknown: { text: 'Unknown', cls: 'bg-gray-100 text-gray-600' },
}

/** What the screen last told us about itself in its heartbeat. */
export function ScreenDeviceCard({ info }: { info: PlayerInfo }) {
    if (!info) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="font-medium text-sm text-gray-900">Device</h3>
                <p className="text-xs text-gray-500 mt-1">No report yet. It appears within a minute of the player starting.</p>
            </div>
        )
    }
    const v = VERDICT[info.verdict ?? 'unknown']
    const rows: [string, string][] = [
        ['Resolution', info.viewport ?? '—'],
        ['Works offline', info.offline_cache ? 'Yes' : 'Not yet'],
        ['Stays awake', info.wake_lock ? 'Wake Lock' : 'Fallback only'],
    ]
    if (info.memory_gb) rows.push(['Memory', `${info.memory_gb} GB`])
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-sm text-gray-900">Device</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.cls}`}>{v.text}</span>
            </div>
            <p className="text-sm text-gray-800">{info.label ?? 'Unknown device'}</p>
            {info.note && <p className="text-xs text-gray-600">{info.note}</p>}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {rows.map(([k, val]) => (
                    <div key={k} className="contents">
                        <dt className="text-gray-500">{k}</dt>
                        <dd className="text-gray-800 text-right">{val}</dd>
                    </div>
                ))}
            </dl>
            {info.reported_at && (
                <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
                    reported {new Date(info.reported_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
            )}
        </div>
    )
}
