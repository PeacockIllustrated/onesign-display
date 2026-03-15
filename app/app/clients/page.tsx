import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CreateClientButton } from '@/components/admin/create-client-button'
import { HelpIcon } from '@/components/ui/help-icon'
import { redirect } from 'next/navigation'

export default async function ClientsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin') {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">Access Denied</p>
            </div>
        )
    }

    const { data: clients } = await supabase.from('clients').select('*, stores(count)').order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <HelpIcon section="clients" />
                </div>
                <CreateClientButton />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clients?.map((client) => (
                    <Link href={`/app/clients/${client.id}`} key={client.id} className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-black transition-colors shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{client.slug}</p>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                            <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                                {client.stores?.[0]?.count ?? 0} Stores
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
