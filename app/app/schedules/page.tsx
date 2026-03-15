import { createClient } from '@/lib/supabase/server'
import { CreateScheduleButton } from '@/components/admin/create-schedule-button'
import { ClientSelector } from '@/components/portal/client-selector'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HelpIcon } from '@/components/ui/help-icon'

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: role } = await supabase.from('profiles').select('client_id, role').eq('id', user.id).single()

    let activeClientId = role?.client_id
    let availableClients: { id: string, name: string }[] = []

    if (role?.role === 'super_admin') {
        const { data: clients } = await supabase.from('clients').select('id, name').order('name')
        availableClients = clients || []
        activeClientId = searchClientId || availableClients[0]?.id
    }

    // Fetch Stores for dropdown (Filtered by Active Client)
    let storeQuery = supabase.from('stores').select('id, name').order('name')
    if (activeClientId) {
        storeQuery = storeQuery.eq('client_id', activeClientId)
    }
    const { data: stores } = await storeQuery

    // Fetch Schedules (Filtered by Active Client via Store)
    // Note: Using !inner on join to filter by relation field
    let schedulesQuery = supabase
        .from('schedules')
        .select(`
            *,
            store:stores!inner(name, client_id)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

    if (activeClientId) {
        schedulesQuery = schedulesQuery.eq('store.client_id', activeClientId)
    }

    const { data: schedules } = await schedulesQuery

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">Schedules</h1>
                        <HelpIcon section="schedules" />
                    </div>
                    {role?.role === 'super_admin' && (
                        <ClientSelector clients={availableClients} />
                    )}
                </div>
                <div className="w-full md:w-auto">
                    <CreateScheduleButton stores={stores || []} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {schedules?.map((schedule) => (
                    <Link href={`/app/schedules/${schedule.id}`} key={schedule.id} className="block p-6 bg-white rounded-lg border border-zinc-200 hover:border-black transition-colors shadow-sm group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold tracking-wide uppercase text-zinc-900 group-hover:text-black">{schedule.name}</h3>
                                <p className="text-sm text-zinc-500">{schedule.store?.name}</p>
                            </div>
                            <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </span>
                        </div>
                        <div className="mt-4 flex gap-1 flex-wrap">
                            {/* Small Day Indicators */}
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${schedule.days_of_week.includes(i) ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {d}
                                </span>
                            ))}
                        </div>
                    </Link>
                ))}
                {(schedules?.length === 0 || !schedules) && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No schedules found for this client. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
