import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    accent,
}: {
    label: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    accent?: 'green' | 'red' | 'amber'
}) {
    return (
        <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">{label}</p>
                {Icon && (
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        accent === 'green' ? 'bg-green-50' :
                        accent === 'red' ? 'bg-red-50' :
                        accent === 'amber' ? 'bg-amber-50' :
                        'bg-zinc-100'
                    )}>
                        <Icon className={cn(
                            "w-4 h-4",
                            accent === 'green' ? 'text-green-600' :
                            accent === 'red' ? 'text-red-500' :
                            accent === 'amber' ? 'text-amber-600' :
                            'text-zinc-600'
                        )} />
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-zinc-900 mt-2">{value}</p>
            {subtitle && (
                <p className={cn(
                    "text-xs mt-1",
                    accent === 'green' ? 'text-green-600' :
                    accent === 'red' ? 'text-red-500' :
                    accent === 'amber' ? 'text-amber-600' :
                    'text-zinc-500'
                )}>
                    {subtitle}
                </p>
            )}
        </div>
    )
}
