import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CreateStoreButton } from '@/components/admin/create-store-button'
import { CreateUserButton } from '@/components/admin/create-user-button'

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params
    const supabase = await createClient()

    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()
    const { data: stores } = await supabase.from('stores').select('*, screen_sets(count)').eq('client_id', clientId).order('name')
    const { data: users } = await supabase.from('profiles').select('*').eq('client_id', clientId).order('created_at', { ascending: false })

    if (!client) return notFound()

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <Link href="/app" className="text-sm text-zinc-500 hover:text-zinc-900 mb-1 block">&larr; Back to Dashboard</Link>
                    <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">{client.name}</h1>
                    <p className="text-zinc-500">{client.slug}</p>
                </div>
            </div>

            {/* Stores Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold tracking-wide uppercase text-zinc-900">Stores</h3>
                    <CreateStoreButton clientId={client.id} />
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-zinc-200">
                    <ul role="list" className="divide-y divide-zinc-200">
                        {stores?.map((store) => (
                            <li key={store.id}>
                                <Link href={`/app/stores/${store.id}`} className="block hover:bg-gray-50 transition-colors">
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <p className="text-sm font-medium text-zinc-900 truncate">{store.name}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <p className="text-sm text-zinc-500 flex items-center">
                                                {store.screen_sets?.[0]?.count ?? 0} Screen Sets
                                            </p>
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {stores?.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500 text-sm">
                                No stores found.
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Users Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold tracking-wide uppercase text-zinc-900">Users</h3>
                    <CreateUserButton clientId={client.id} />
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                        {users?.map((user) => (
                            <li key={user.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-zinc-900">{user.name || 'Unnamed User'}</p>
                                    <p className="text-sm text-zinc-500">{user.role}</p>
                                </div>
                                <div className="text-sm text-zinc-400">
                                    {/* Email is not in profiles table? Need to join with auth or just show name */}
                                    {/* Profiles table in schema: id, role, client_id, name */}
                                    {/* We can't see email unless we join auth.users which is restricted. 
                                        We will just show Name for now, or fetch email if possible. 
                                        Wait, create policy 'View profiles' allows reading own or super admin.
                                        But 'profiles' doesn't have email column.
                                        We cannot easily show email here without an RPC or admin function. 
                                        We will stick to Name and Role. */}
                                    ID: {user.id.slice(0, 8)}...
                                </div>
                            </li>
                        ))}
                        {users?.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500 text-sm">
                                No users found.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
