import { createClient } from '@/lib/supabase/server';
import { NewSpecialView } from '@/components/specials/new-special-view';
import { getTemplates } from '../actions';
import { redirect } from 'next/navigation';

export default async function NewSpecialPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Fetch Profile Role
    const { data: profile } = await supabase.from('profiles').select('client_id, role').eq('id', user.id).single();

    let clients: { id: string, name: string }[] = [];
    let userClientId: string | undefined = undefined;

    if (profile?.role === 'super_admin') {
        const { data: fetchedClients } = await supabase.from('clients').select('id, name').order('name');
        clients = fetchedClients || [];
    } else {
        userClientId = profile?.client_id;
    }

    // Determine effective client ID for fetching templates (default to user's client or first available)
    const activeClientId = userClientId || (clients.length > 0 ? clients[0].id : undefined);

    let customTemplates: any[] = [];
    if (activeClientId) {
        // Feature Gate Check
        const { data: plan } = await supabase.from('client_plans')
            .select('specials_studio_enabled, design_package_included, managed_design_support')
            .eq('client_id', activeClientId)
            .single();

        const isEnabled = plan?.specials_studio_enabled || plan?.design_package_included || plan?.managed_design_support || false;

        if (!isEnabled) {
            redirect('/app/specials');
        }

        customTemplates = await getTemplates(activeClientId);
    }

    return <NewSpecialView clients={clients} userClientId={userClientId} customTemplates={customTemplates} />;
}
