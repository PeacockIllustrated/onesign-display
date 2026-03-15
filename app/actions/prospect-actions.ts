'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProspectStatus(prospectId: string, status: string) {
    const supabase = await createClient();

    // Verify user is super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin') {
        throw new Error('Not authorized');
    }

    const { error } = await supabase
        .from('prospects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', prospectId);

    if (error) throw error;

    revalidatePath('/app/prospects');
}

export async function updateProspectNotes(prospectId: string, notes: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin') {
        throw new Error('Not authorized');
    }

    const { error } = await supabase
        .from('prospects')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', prospectId);

    if (error) throw error;

    revalidatePath('/app/prospects');
}
