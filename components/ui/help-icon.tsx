import Link from 'next/link'
import { CircleHelp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpIconProps {
    section?: string
    className?: string
}

export function HelpIcon({ section, className }: HelpIconProps) {
    const href = section ? `/app/guide#${section}` : '/app/guide'

    return (
        <Link
            href={href}
            title="Help & User Guide"
            className={cn("text-zinc-400 hover:text-zinc-600 transition-colors inline-flex items-center justify-center", className)}
        >
            <CircleHelp className="w-5 h-5" />
            <span className="sr-only">Help</span>
        </Link>
    )
}
