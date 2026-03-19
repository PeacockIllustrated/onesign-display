import { cn } from '@/lib/utils'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

function isOnline(lastSeenAt: string | null): boolean {
    if (!lastSeenAt) return false
    return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}

type ScreenInfo = {
    id: string
    name: string
    last_seen_at: string | null
    content_name?: string | null
    store_name: string
    screen_set_name: string
}

export function ScreenStatusPanel({
    screens,
    title = 'Screen Status',
    showAllLink,
}: {
    screens: ScreenInfo[]
    title?: string
    showAllLink?: string
}) {
    // Sort: offline first, then by store/screen set
    const sorted = [...screens].sort((a, b) => {
        const aOnline = isOnline(a.last_seen_at)
        const bOnline = isOnline(b.last_seen_at)
        if (aOnline !== bOnline) return aOnline ? 1 : -1
        return `${a.store_name}${a.screen_set_name}${a.name}`.localeCompare(
            `${b.store_name}${b.screen_set_name}${b.name}`
        )
    })

    const allOnline = screens.length > 0 && screens.every(s => isOnline(s.last_seen_at))
    const offlineCount = screens.filter(s => !isOnline(s.last_seen_at)).length

    return (
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                    {offlineCount > 0 && (
                        <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                            {offlineCount} offline
                        </span>
                    )}
                </div>
                {showAllLink && (
                    <Link href={showAllLink} className="text-xs text-zinc-500 hover:text-zinc-900">
                        View all
                    </Link>
                )}
            </div>

            {screens.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-400">
                    No screens configured yet
                </div>
            ) : allOnline ? (
                <div className="px-5 py-6 flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">All {screens.length} screens operational</span>
                </div>
            ) : (
                <div className="divide-y divide-zinc-50">
                    {sorted.map((screen) => {
                        const online = isOnline(screen.last_seen_at)
                        return (
                            <Link
                                key={screen.id}
                                href={`/app/screens/${screen.id}`}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors"
                            >
                                <span className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    online ? "bg-green-500" : "bg-red-400"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-900 truncate">
                                        {screen.name}
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate">
                                        {screen.store_name} &middot; {screen.screen_set_name}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={cn(
                                        "text-xs font-medium",
                                        online ? "text-green-600" : "text-red-500"
                                    )}>
                                        {online ? 'Online' : 'Offline'}
                                    </p>
                                    <p className="text-[10px] text-zinc-400">
                                        {screen.last_seen_at ? timeAgo(screen.last_seen_at) : 'Never seen'}
                                    </p>
                                </div>
                                {screen.content_name && (
                                    <span className="hidden sm:inline text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                        {screen.content_name}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
