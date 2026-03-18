'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Store, Image, Calendar, LogOut, Menu, X, BookOpen, UserPlus, ListVideo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/(auth)/auth/login/actions'
import { useState } from 'react'

const navigation = [
    { name: 'Overview', href: '/app', icon: Home },
    { name: 'Clients', href: '/app/clients', icon: Users, adminOnly: true },
    { name: 'Prospects', href: '/app/prospects', icon: UserPlus, adminOnly: true },
    /* { name: 'Stores', href: '/app/stores', icon: Store }, // Stores are usually accessed via Clients or Overview for Super Admin */
    { name: 'Media', href: '/app/media', icon: Image },
    { name: 'Playlists', href: '/app/playlists', icon: ListVideo },
    { name: 'Specials', href: '/app/specials', icon: Image },
    { name: 'Schedules', href: '/app/schedules', icon: Calendar },
    { name: 'User Guide', href: '/app/guide', icon: BookOpen },
]

export function Sidebar({ userRole, userEmail, clientName }: {
    userRole: 'super_admin' | 'client_admin',
    userEmail?: string,
    clientName?: string
}) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => setIsOpen(!isOpen)

    const NavContent = () => (
        <>
            <div className="flex items-center px-6 h-16 border-b border-zinc-200">
                <img src="/onesign-logo-dark.png" alt="Onesign" className="h-6 w-auto" />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
                <nav className="mt-5 flex-1 px-2 space-y-1">
                    {navigation.map((item) => {
                        if (item.adminOnly && userRole !== 'super_admin') return null

                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    isActive
                                        ? 'bg-zinc-100 text-zinc-900'
                                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900',
                                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-500',
                                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="flex-shrink-0 flex flex-col border-t border-zinc-200">
                {/* User Profile Info */}
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                    <p className="text-xs font-semibold text-zinc-900 truncate" title={userEmail}>
                        {userEmail}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-0.5">
                        {userRole === 'super_admin' ? 'Super Admin' : clientName || 'Client Admin'}
                    </p>
                    {userRole !== 'super_admin' && clientName && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">Admin</p>
                    )}
                </div>

                <div className="p-4">
                    <form action={logout} className="w-full">
                        <button className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
                                        Sign out
                                    </p>
                                </div>
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4 justify-between">
                <img src="/onesign-logo-dark.png" alt="Onesign" className="h-6 w-auto" />
                <button onClick={toggle} className="p-2 -mr-2 text-gray-600 hover:text-gray-900">
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={toggle}></div>
                    <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl transform transition-transform">
                        <div className="absolute top-0 right-0 pt-2 -mr-12">
                            <button className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={toggle}>
                                <span className="sr-only">Close sidebar</span>
                                <X className="h-6 w-6 text-white" aria-hidden="true" />
                            </button>
                        </div>
                        <NavContent />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
                <NavContent />
            </div>

            {/* Mobile Spacer to push content down active only on mobile */}
            <div className="md:hidden h-16 w-full shrink-0" />
        </>
    )
}
