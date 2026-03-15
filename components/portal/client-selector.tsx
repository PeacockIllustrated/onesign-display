'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ClientSelector({ clients, activeClientId }: { clients: { id: string, name: string }[], activeClientId?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentClientId = activeClientId || searchParams.get('clientId') || (clients.length > 0 ? clients[0].id : '')
    const selectedClient = clients.find(c => c.id === currentClientId) || clients[0]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (clientId: string) => {
        router.push(`${pathname}?clientId=${clientId}`)
        setIsOpen(false)
    }

    if (clients.length === 0) return null

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-[220px] rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            >
                <span className="truncate">{selectedClient?.name || 'Select Client'}</span>
                <ChevronDown className={cn("ml-2 h-4 w-4 text-zinc-500 transition-transform", isOpen && "transform rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-[220px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="py-1">
                        {clients.map((client) => (
                            <button
                                key={client.id}
                                onClick={() => handleSelect(client.id)}
                                className={cn(
                                    "flex w-full items-center justify-between px-4 py-2 text-sm text-left hover:bg-zinc-50 transition-colors",
                                    client.id === currentClientId ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-700"
                                )}
                            >
                                <span className="truncate">{client.name}</span>
                                {client.id === currentClientId && (
                                    <Check className="h-4 w-4 text-black" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
