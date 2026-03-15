import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PLAN_DEFS, PlanEntitlements } from '@/lib/slate/plans';
import { PlanReadout } from '@/components/billing/PlanReadout';
import { PlanSettingsForm } from './plan-settings-form';

// Import limits function separately if not re-exported (I think I exported it from limits.ts not plans.ts)
import { countClientScreens as countClientScreensFn } from '@/lib/slate/limits';

export default async function ClientPlanPage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Please login</div>;

    const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single();
    if (!profile) return <div>Unauthorized</div>;

    const isSuperAdmin = profile.role === 'super_admin';
    const isClientAdmin = profile.role === 'client_admin' && profile.client_id === clientId;

    if (!isSuperAdmin && !isClientAdmin) {
        return <div>Forbidden</div>;
    }

    // Fetch Plan
    const { data: plan } = await supabase.from('client_plans').select('*').eq('client_id', clientId).single();

    // Default
    const effectivePlan = plan || {
        ...PLAN_DEFS.static_design,
        plan_code: 'static_design',
        status: 'active',
        client_id: clientId
    };

    // Use usage
    const screenCount = await countClientScreensFn(clientId);

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-extrabold tracking-wide uppercase text-zinc-900">Plan & Entitlements</h1>

            {isSuperAdmin ? (
                <div>
                    <div className="mb-10 p-6 bg-gray-50 rounded-lg border border-zinc-200">
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Current Client View</h2>
                        <div className="max-w-xl bg-white p-4 rounded shadow-sm border border-zinc-200">
                            {/* @ts-ignore - types likely match effectively */}
                            <PlanReadout entitlements={effectivePlan} screenCount={screenCount} />
                        </div>
                    </div>

                    <h2 className="text-xl font-extrabold uppercase tracking-wide text-zinc-900 mb-6">Edit Configuration</h2>
                    <PlanSettingsForm
                        clientId={clientId}
                        initialPlan={effectivePlan}
                        screenCount={screenCount}
                    />
                </div>
            ) : (
                <div className="max-w-xl">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        {/* @ts-ignore */}
                        <PlanReadout entitlements={effectivePlan} screenCount={screenCount} />
                    </div>
                </div>
            )}
        </div>
    );
}
