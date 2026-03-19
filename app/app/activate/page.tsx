import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanShortName, PLAN_PRICES, getPlanIncludedFeatures, PLAN_DEFS, type PlanCode } from '@/lib/slate/plans'
import { Check } from 'lucide-react'

const STRIPE_LINKS: Record<string, string> = {
    static_design: process.env.STRIPE_PAYMENT_LINK_STATIC || '#',
    video_design_system: process.env.STRIPE_PAYMENT_LINK_VIDEO || '#',
    pro_managed: process.env.STRIPE_PAYMENT_LINK_PRO || '#',
}

export default async function ActivatePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('display_profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

    if (!profile?.client_id) redirect('/app')

    const { data: plan } = await supabase
        .from('display_client_plans')
        .select('plan_code, payment_status')
        .eq('client_id', profile.client_id)
        .single()

    if (!plan || plan.payment_status === 'paid') redirect('/app')

    const planCode = plan.plan_code as PlanCode
    const planName = getPlanShortName(planCode)
    const price = PLAN_PRICES[planCode]
    const features = getPlanIncludedFeatures(PLAN_DEFS[planCode])
    const stripeLink = STRIPE_LINKS[planCode] || '#'

    return (
        <div className="max-w-lg mx-auto py-12">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Activate Your Plan</h1>
            <p className="text-zinc-500 text-sm mb-8">
                You&apos;re currently on a free trial. Complete payment to keep your account active.
            </p>

            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-semibold text-zinc-900">{planName}</h2>
                        <span className="text-lg font-bold text-zinc-900">
                            &pound;{price}<span className="text-sm font-normal text-zinc-500">/mo per screen</span>
                        </span>
                    </div>
                </div>

                <ul className="space-y-2">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
                            <Check className="h-4 w-4 text-green-600 shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>

                <a
                    href={stripeLink}
                    className="block w-full text-center py-2.5 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                    Complete Payment
                </a>

                <p className="text-xs text-zinc-400 text-center">
                    Need help? Contact{' '}
                    <a href="mailto:sales@onesignanddigital.com" className="text-zinc-600 hover:underline">
                        sales@onesignanddigital.com
                    </a>
                </p>
            </div>
        </div>
    )
}
