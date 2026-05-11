import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
    eventLabel,
    severityDotClass,
    severityTextClass,
    summariseDetails,
    timeAgo,
    type ScreenEvent,
} from '@/lib/event-formatting'

type Props = {
    event: ScreenEvent
    screen?: { id: string; name: string; storeName?: string | null } | null
}

export function EventRow({ event, screen }: Props) {
    const summary = summariseDetails(event.event_type, event.details)
    const time = timeAgo(event.created_at)
    const dotClass = severityDotClass(event.severity)
    const textClass = severityTextClass(event.severity)
    const isoTitle = new Date(event.created_at).toISOString()

    const inner = (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', textClass)}>
                    {eventLabel(event.event_type)}
                    {summary && <span className="text-zinc-500 font-normal"> · {summary}</span>}
                </p>
                {screen && (
                    <p className="text-xs text-zinc-400 truncate">
                        {screen.name}
                        {screen.storeName ? ` · ${screen.storeName}` : ''}
                    </p>
                )}
            </div>
            <span className="text-[11px] text-zinc-400 shrink-0" title={isoTitle}>{time}</span>
        </div>
    )

    if (screen) {
        return (
            <Link href={`/app/screens/${screen.id}`} className="block hover:bg-zinc-50 transition-colors">
                {inner}
            </Link>
        )
    }
    return <div>{inner}</div>
}
