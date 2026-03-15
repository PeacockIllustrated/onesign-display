import { createClient } from '@/lib/supabase/server';
import { PlanEntitlements } from './plans';

export async function countClientScreens(clientId: string): Promise<number> {
    const supabase = await createClient();

    // Count all screens belonging to stores of this client
    const { count, error } = await supabase
        .from('screens')
        .select('id, stores!inner(client_id)', { count: 'exact', head: true })
        .eq('stores.client_id', clientId);

    if (error) {
        console.error('Error counting screens:', error);
        throw new Error('Failed to count screens');
    }

    return count || 0;
}

export class PlanLimitError extends Error {
    code: 'PLAN_LIMIT';
    constructor(message: string) {
        super(message);
        this.code = 'PLAN_LIMIT';
        this.name = 'PlanLimitError';
    }
}

export async function assertWithinScreenLimit(clientId: string, entitlements: PlanEntitlements) {
    // If unlimited, skip check
    if (entitlements.max_screens >= 9999) return;

    const currentCount = await countClientScreens(clientId);

    if (currentCount >= entitlements.max_screens) {
        throw new PlanLimitError(
            `Plan limit reached: ${entitlements.max_screens} screens allowed. upgrades required to add more.`
        );
    }
}
