import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { CreateClientButton } from '@/components/admin/create-client-button'
import { CreditCard } from 'lucide-react'
import { HelpIcon } from '@/components/ui/help-icon'

async function DashboardContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const role = profile?.role || 'client_admin'

    // If super_admin, show all clients
    if (role === 'super_admin') {
        const { data: clients } = await supabase.from('clients').select('*, stores(count)').order('created_at', { ascending: false })

        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">Clients</h1>
                        <HelpIcon section="clients" />
                    </div>
                    <CreateClientButton />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clients?.map((client) => (
                        <div key={client.id} className="relative group p-6 bg-white rounded-lg border border-zinc-200 hover:border-black transition-colors shadow-sm">
                            <Link href={`/app/clients/${client.id}`} className="absolute inset-0 z-0">
                                <span className="sr-only">View Client</span>
                            </Link>

                            <div className="relative z-10 pointer-events-none">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold tracking-wide uppercase text-zinc-900 pr-8">{client.name}</h3>
                                </div>
                                <p className="text-sm text-zinc-500 mt-1">{client.slug}</p>
                                <div className="mt-4 flex items-center text-sm text-zinc-500">
                                    <span className="bg-zinc-100 text-zinc-700 font-bold uppercase tracking-wider py-1 px-2 rounded-full text-xs">
                                        {client.stores?.[0]?.count ?? 0} Stores
                                    </span>
                                </div>
                            </div>

                            <Link
                                href={`/app/clients/${client.id}/plan`}
                                className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                                title="Manage Plan"
                            >
                                <CreditCard size={18} />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Client Admin View
    const { data: stores } = await supabase.from('stores').select('*, screen_sets(count)').eq('client_id', profile?.client_id).order('name')

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">Dashboard</h1>
                    <HelpIcon section="overview" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stores?.map((store) => (
                    <Link href={`/app/stores/${store.id}`} key={store.id} className="block p-6 bg-white rounded-lg border border-zinc-200 hover:border-black transition-colors shadow-sm">
                        <h3 className="text-lg font-bold tracking-wide uppercase text-zinc-900">{store.name}</h3>
                        <div className="mt-4 flex items-center text-sm text-zinc-500">
                            <span className="bg-zinc-100 text-zinc-700 font-bold uppercase tracking-wider py-1 px-2 rounded-full text-xs">
                                {store.screen_sets?.[0]?.count ?? 0} Screen Sets
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    )
}
