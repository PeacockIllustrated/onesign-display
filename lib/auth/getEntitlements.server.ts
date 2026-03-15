import { createClient } from '@/lib/supabase/server';
import { PlanCode, PlanEntitlements, PLAN_DEFS, Entitlements } from '@/lib/slate/plans';
import { redirect } from 'next/navigation';

export class PlanError extends Error {
    code: 'PLAN_REQUIRED' | 'PLAN_LIMIT' | 'PLAN_INACTIVE';
    detail?: any;

    constructor(code: 'PLAN_REQUIRED' | 'PLAN_LIMIT' | 'PLAN_INACTIVE', message: string, detail?: any) {
        super(message);
        this.code = code;
        this.detail = detail;
        this.name = 'PlanError';
    }
}

// Update signature to allow overriding client_id (e.g. for super_admin)
export async function getEntitlements(overrideClientId?: string): Promise<Entitlements> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    let targetClientId: string | null = null;

    if (overrideClientId) {
        // Optional: Verify permission to use override? 
        // Typically the caller (action) should have verified permissions (e.g. super admin).
        // We trust the caller here for simplicity, or we can double check role.
        targetClientId = overrideClientId;
    } else {
        // Get user profile to find client_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('client_id, role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            throw new Error('Failed to fetch user profile');
        }

        targetClientId = profile.client_id;
    }

    if (!targetClientId) {
        // Super admin or unassigned? 
        // For this logic, we assume we need a client context.
        // If super admin is browsing a specific client, that should be passed in, 
        // but 'getEntitlements' is usually for the "current user's implicit client".
        // If super admin, we might return a 'god mode' entitlement or throw if they aren't 'acting as' a client.
        // For now, let's assume this is strictly for CLIENT context actions.
        throw new Error('No client context found for user');
    }

    const { data: plan, error: planError } = await supabase
        .from('client_plans')
        .select('*')
        .eq('client_id', targetClientId)
        .single();

    if (planError && planError.code !== 'PGRST116') { // PGRST116 is "no rows"
        console.error('Plan fetch error:', planError);
        // Fail safe?
    }

    // Default if missing
    if (!plan) {
        return {
            plan_code: 'static_design',
            status: 'active', // Assume active if missing context? Or maybe safer to be "active" so they aren't blocked immediately
            client_id: targetClientId,
            ...PLAN_DEFS.static_design
        };
    }

    return {
        plan_code: plan.plan_code as PlanCode,
        status: plan.status,
        client_id: targetClientId,

        max_screens: plan.max_screens,
        video_enabled: plan.video_enabled,
        specials_studio_enabled: plan.specials_studio_enabled,
        scheduling_enabled: plan.scheduling_enabled,
        four_k_enabled: plan.four_k_enabled,
        design_package_included: plan.design_package_included,
        managed_design_support: plan.managed_design_support,
    };
}

export function assertEntitlement(entitlements: Entitlements, feature: keyof PlanEntitlements) {
    assertPlanActive(entitlements);

    if (!entitlements[feature]) {
        throw new PlanError(
            'PLAN_REQUIRED',
            `This feature requires a plan upgrade. (${feature})`
        );
    }
}

export function assertPlanActive(entitlements: Entitlements) {
    if (entitlements.status === 'paused' || entitlements.status === 'cancelled') {
        throw new PlanError(
            'PLAN_INACTIVE',
            `Plan is ${entitlements.status}. Please contact support or check billing.`
        );
    }
    // Allow 'past_due' (grace period)
}
