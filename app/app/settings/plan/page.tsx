import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPlanPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/auth/login');

    const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();

    if (!profile?.client_id) {
        return <div className="p-8">No client associated with this account.</div>;
    }

    // Redirect to the canonical client plan page which handles both roles
    redirect(`/app/clients/${profile.client_id}/plan`);
}
