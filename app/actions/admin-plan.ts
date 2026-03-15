'use server';

import { createClient } from '@/lib/supabase/server';
import { PlanCode, PlanEntitlements, PLAN_DEFS } from '@/lib/slate/plans';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PlanUpdateSchema = z.object({
    clientId: z.string().uuid(),
    planCode: z.enum(['static_design', 'video_design_system', 'pro_managed', 'enterprise']),
    status: z.enum(['active', 'past_due', 'paused', 'cancelled']),
    maxScreens: z.coerce.number().min(1),
    videoEnabled: z.coerce.boolean(),
    specialsEnabled: z.coerce.boolean(),
    schedulingEnabled: z.coerce.boolean(),
    fourKEnabled: z.coerce.boolean(),
    designPackage: z.coerce.boolean(),
    managedSupport: z.coerce.boolean(),
    notes: z.string().optional(),
});

export async function updateClientPlan(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Check Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') {
        return { error: 'Forbidden: Only Super Admins can manage plans.' };
    }

    // Parse Data
    const rawData = {
        clientId: formData.get('clientId'),
        planCode: formData.get('planCode'),
        status: formData.get('status'),
        maxScreens: formData.get('maxScreens'),
        videoEnabled: formData.get('videoEnabled') === 'on',
        specialsEnabled: formData.get('specialsEnabled') === 'on',
        schedulingEnabled: formData.get('schedulingEnabled') === 'on',
        fourKEnabled: formData.get('fourKEnabled') === 'on',
        designPackage: formData.get('designPackage') === 'on',
        managedSupport: formData.get('managedSupport') === 'on',
        notes: formData.get('notes'),
    };

    const parse = PlanUpdateSchema.safeParse(rawData);
    if (!parse.success) {
        return { error: 'Invalid data', details: parse.error.flatten() };
    }

    const data = parse.data;

    // Diffing
    const { data: oldPlan } = await supabase.from('client_plans').select('*').eq('client_id', data.clientId).single();

    const updates = {
        client_id: data.clientId,
        plan_code: data.planCode,
        status: data.status,
        max_screens: data.maxScreens,
        video_enabled: data.videoEnabled,
        specials_studio_enabled: data.specialsEnabled,
        scheduling_enabled: data.schedulingEnabled,
        four_k_enabled: data.fourKEnabled,
        design_package_included: data.designPackage,
        managed_design_support: data.managedSupport,
        notes: data.notes || null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('client_plans').upsert(updates);

    if (error) {
        console.error('Plan update failed:', error);
        return { error: 'Database update failed' };
    }

    // Audit Log
    const changes: Record<string, any> = {};
    if (oldPlan) {
        // Compare
        for (const key in updates) {
            // @ts-ignore
            if (oldPlan[key] !== updates[key] && key !== 'updated_at' && key !== 'updated_by') {
                // @ts-ignore
                changes[key] = { from: oldPlan[key], to: updates[key] };
            }
        }
    } else {
        changes['new_plan'] = updates;
    }

    await supabase.from('audit_log').insert({
        actor_id: user.id,
        entity: 'client_plan',
        entity_id: data.clientId,
        action: 'update',
        details: changes
    });

    revalidatePath(`/app/clients/${data.clientId}/plan`);
    return { success: true };
}
