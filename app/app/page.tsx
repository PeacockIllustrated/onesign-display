import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { CreateClientButton } from '@/components/admin/create-client-button'
import { StatCard } from '@/components/portal/stat-card'
import { ScreenStatusPanel } from '@/components/portal/screen-status-panel'
import { Users, Monitor, Wifi, UserPlus, Image, Calendar, CreditCard } from 'lucide-react'

function isOnline(lastSeenAt: string | null): boolean {
    if (!lastSeenAt) return false
    return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000
}

async function SuperAdminDashboard() {
    const supabase = await createClient()

    // Fetch all stats in parallel
    const [clientsRes, screensRes, prospectsRes, clientsDetailRes] = await Promise.all([
        supabase.from('display_clients').select('*', { count: 'exact', head: true }),
        supabase.from('display_screens').select('id, name, last_seen_at, store_id, screen_set_id'),
        supabase.from('display_prospects').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('display_clients').select('id, name, slug, display_stores(count)').order('created_at', { ascending: false }),
    ])

    const totalClients = clientsRes.count ?? 0
    const allScreens = screensRes.data ?? []
    const totalScreens = allScreens.length
    const onlineScreens = allScreens.filter(s => isOnline(s.last_seen_at)).length
    const offlineScreens = totalScreens - onlineScreens
    const newProspects = prospectsRes.count ?? 0
    const clients = clientsDetailRes.data ?? []

    // Build screen status data — need store and screen set names
    const storeIds = [...new Set(allScreens.map(s => s.store_id).filter(Boolean))]
    const setIds = [...new Set(allScreens.map(s => s.screen_set_id).filter(Boolean))]

    let storeMap: Record<string, string> = {}
    let setMap: Record<string, string> = {}

    if (storeIds.length > 0) {
        const { data: stores } = await supabase
            .from('display_stores')
            .select('id, name')
            .in('id', storeIds)
        stores?.forEach(s => { storeMap[s.id] = s.name })
    }

    if (setIds.length > 0) {
        const { data: sets } = await supabase
            .from('display_screen_sets')
            .select('id, name')
            .in('id', setIds)
        sets?.forEach(s => { setMap[s.id] = s.name })
    }

    const screenStatusData = allScreens.map(s => ({
        id: s.id,
        name: s.name,
        last_seen_at: s.last_seen_at,
        store_name: storeMap[s.store_id] || 'Unknown Store',
        screen_set_name: setMap[s.screen_set_id] || 'Unknown Set',
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-zinc-900">Platform Overview</h1>
                <CreateClientButton />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Clients"
                    value={totalClients}
                    icon={Users}
                />
                <StatCard
                    label="Total Screens"
                    value={totalScreens}
                    subtitle={offlineScreens > 0 ? `${offlineScreens} offline` : 'All online'}
                    icon={Monitor}
                    accent={offlineScreens > 0 ? 'red' : undefined}
                />
                <StatCard
                    label="Screens Online"
                    value={onlineScreens}
                    subtitle={totalScreens > 0 ? `${Math.round((onlineScreens / totalScreens) * 100)}% uptime` : undefined}
                    icon={Wifi}
                    accent="green"
                />
                <StatCard
                    label="New Prospects"
                    value={newProspects}
                    subtitle={newProspects > 0 ? 'Awaiting response' : 'All handled'}
                    icon={UserPlus}
                    accent={newProspects > 0 ? 'amber' : undefined}
                />
            </div>

            {/* Screen Health */}
            <ScreenStatusPanel screens={screenStatusData} title="Screen Health" />

            {/* Client Quick Access */}
            <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Clients</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                        <div key={client.id} className="relative group p-4 bg-white rounded-lg border border-zinc-200 hover:border-black transition-colors shadow-sm">
                            <Link href={`/app/clients/${client.id}`} className="absolute inset-0 z-0">
                                <span className="sr-only">View Client</span>
                            </Link>
                            <div className="relative z-10 pointer-events-none">
                                <h3 className="text-sm font-semibold text-zinc-900">{client.name}</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">{client.slug}</p>
                                <div className="mt-2">
                                    <span className="bg-zinc-100 text-zinc-600 font-medium py-0.5 px-2 rounded-full text-[10px]">
                                        {client.display_stores?.[0]?.count ?? 0} stores
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={`/app/clients/${client.id}/plan`}
                                className="absolute top-3 right-3 z-20 p-1.5 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                                title="Manage Plan"
                            >
                                <CreditCard size={14} />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

async function ClientAdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('display_profiles').select('client_id').eq('id', user.id).single()
    if (!profile?.client_id) return null

    const clientId = profile.client_id

    // Fetch all stats in parallel
    const [storesRes, mediaRes, schedulesRes] = await Promise.all([
        supabase
            .from('display_stores')
            .select('id, name, display_screen_sets(id, name, display_screens(id, name, last_seen_at))')
            .eq('client_id', clientId)
            .order('name'),
        supabase.from('display_media_assets').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
        supabase.from('display_schedules').select('id, store_id').in(
            'store_id',
            // Subquery: get store IDs for this client
            (await supabase.from('display_stores').select('id').eq('client_id', clientId)).data?.map(s => s.id) ?? []
        ),
    ])

    const stores = storesRes.data ?? []
    const mediaCount = mediaRes.count ?? 0
    const activeSchedules = schedulesRes.data?.length ?? 0

    // Flatten screens for stats and status panel
    const allScreens: { id: string; name: string; last_seen_at: string | null; store_name: string; screen_set_name: string }[] = []
    stores.forEach(store => {
        const sets = (store.display_screen_sets as any[]) ?? []
        sets.forEach(set => {
            const screens = (set.display_screens as any[]) ?? []
            screens.forEach(screen => {
                allScreens.push({
                    id: screen.id,
                    name: screen.name,
                    last_seen_at: screen.last_seen_at,
                    store_name: store.name,
                    screen_set_name: set.name,
                })
            })
        })
    })

    const totalScreens = allScreens.length
    const onlineScreens = allScreens.filter(s => isOnline(s.last_seen_at)).length
    const offlineScreens = totalScreens - onlineScreens

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Screens"
                    value={totalScreens}
                    subtitle={offlineScreens > 0 ? `${offlineScreens} offline` : 'All online'}
                    icon={Monitor}
                    accent={offlineScreens > 0 ? 'red' : undefined}
                />
                <StatCard
                    label="Screens Online"
                    value={onlineScreens}
                    subtitle={totalScreens > 0 ? `${Math.round((onlineScreens / totalScreens) * 100)}% uptime` : undefined}
                    icon={Wifi}
                    accent="green"
                />
                <StatCard
                    label="Media Assets"
                    value={mediaCount}
                    icon={Image}
                />
                <StatCard
                    label="Schedules"
                    value={activeSchedules}
                    icon={Calendar}
                />
            </div>

            {/* Screen Status */}
            <ScreenStatusPanel screens={allScreens} title="Screen Status" />

            {/* Store Quick Access */}
            <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Your Stores</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stores.map((store) => {
                        const setCount = (store.display_screen_sets as any[])?.length ?? 0
                        return (
                            <Link
                                href={`/app/stores/${store.id}`}
                                key={store.id}
                                className="block p-4 bg-white rounded-lg border border-zinc-200 hover:border-black transition-colors shadow-sm"
                            >
                                <h3 className="text-sm font-semibold text-zinc-900">{store.name}</h3>
                                <div className="mt-2">
                                    <span className="bg-zinc-100 text-zinc-600 font-medium py-0.5 px-2 rounded-full text-[10px]">
                                        {setCount} screen sets
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

async function DashboardContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('display_profiles').select('role').eq('id', user.id).single()

    if (profile?.role === 'super_admin') {
        return <SuperAdminDashboard />
    }

    return <ClientAdminDashboard />
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-zinc-100 rounded-lg animate-pulse" />
                    ))}
                </div>
                <div className="h-48 bg-zinc-100 rounded-lg animate-pulse" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}
