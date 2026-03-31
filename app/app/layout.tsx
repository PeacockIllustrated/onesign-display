import { Sidebar } from '@/components/portal/sidebar'
import { OnboardingWizard } from '@/components/portal/onboarding-wizard'
import { DashboardSplash } from '@/components/portal/DashboardSplash'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

    // Fetch profile for role, client_id, and onboarding state
    const { data: profile } = await supabase
        .from('display_profiles')
        .select('role, client_id, onboarding_completed')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'client_admin'
    const showOnboarding = profile?.onboarding_completed === false
    let clientName = ''
    let isTrial = false

    if (profile?.client_id) {
        const { data: client } = await supabase
            .from('display_clients')
            .select('name')
            .eq('id', profile.client_id)
            .single()
        if (client) {
            clientName = client.name
        }

        // Check payment status for trial banner
        const { data: plan } = await supabase
            .from('display_client_plans')
            .select('payment_status')
            .eq('client_id', profile.client_id)
            .single()
        isTrial = plan?.payment_status === 'trial'
    }

    return (
        <>
        <DashboardSplash />
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
            <Sidebar
                userRole={role}
                userEmail={user.email}
                clientName={clientName}
            />
            <main className="flex-1 overflow-y-auto">
                {isTrial && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-8 py-2.5 flex items-center justify-between text-sm">
                        <p className="text-amber-800">
                            You&apos;re on a free trial.{' '}
                            <Link href="/app/activate" className="font-semibold underline hover:text-amber-900">
                                Activate your plan
                            </Link>
                            {' '}to keep your account.
                        </p>
                    </div>
                )}
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
            {showOnboarding && <OnboardingWizard clientName={clientName} />}
        </div>
        </>
    )
}
