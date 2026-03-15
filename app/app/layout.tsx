import { Sidebar } from '@/components/portal/sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch profile for role and client_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'client_admin'
    let clientName = ''

    if (profile?.client_id) {
        const { data: client } = await supabase
            .from('clients')
            .select('name')
            .eq('id', profile.client_id)
            .single()
        if (client) {
            clientName = client.name
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
            <Sidebar
                userRole={role}
                userEmail={user.email}
                clientName={clientName}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}
