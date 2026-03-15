import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CreateScreenSetButton } from '@/components/admin/create-screen-set-button'

export default async function StoreDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
    const { storeId } = await params
    const supabase = await createClient()

    // Fetch Store
    const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single()
    if (!store) return notFound()

    // Fetch Screen Sets
    const { data: screenSets } = await supabase
        .from('screen_sets')
        .select('*, screens(count)')
        .eq('store_id', storeId)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {/* Breadcrumb could be dynamic based on role, for now simplistic */}
                    <Link href="/app" className="text-sm text-zinc-500 hover:text-zinc-900 mb-1 block">&larr; Dashboard</Link>
                    <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">{store.name}</h1>
                    <p className="text-sm text-zinc-500">{store.timezone}</p>
                </div>
                <CreateScreenSetButton storeId={storeId} />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {screenSets?.map((set) => (
                    <Link href={`/app/screen-sets/${set.id}`} key={set.id} className="block group">
                        <div className="relative bg-white border border-zinc-200 rounded-lg shadow-sm group-hover:border-black transition-colors overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-bold tracking-wide uppercase text-zinc-900">{set.name}</h3>
                                <div className="mt-2 text-sm text-zinc-500">
                                    {set.screens?.[0]?.count ?? 0} Screens
                                </div>
                            </div>
                            <div className="bg-zinc-50 px-6 py-3 border-t border-zinc-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Visualise</span>
                                <span className="text-zinc-400 group-hover:text-black transition-colors">&rarr;</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
