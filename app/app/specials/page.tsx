import Link from 'next/link';
import { getSpecialsProjects } from './actions';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';
import { ClientSelector } from '@/components/portal/client-selector';
import { ProjectCard } from '@/components/specials/project-card';
import { HelpIcon } from '@/components/ui/help-icon';

export default async function SpecialsListPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const { clientId: searchClientId } = await searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Please login</div>;

    // Fetch Role and Client Context
    const { data: role } = await supabase.from('display_profiles').select('client_id, role').eq('id', user.id).single();

    let activeClientId = role?.client_id;
    let availableClients: { id: string, name: string }[] = [];

    if (role?.role === 'super_admin') {
        const { data: clients } = await supabase.from('display_clients').select('id, name').order('name');
        availableClients = clients || [];
        // Use search param if available, otherwise default to first client
        activeClientId = searchClientId || availableClients[0]?.id;
    }

    if (!activeClientId) {
        return (
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Specials Studio</h1>
                    <p className="text-gray-500">Manage digital signage content.</p>
                </div>
                {role?.role === 'super_admin' ? (
                    <div className="text-center py-12">
                        <p className="mb-4 text-gray-500">Please select a client to view specials.</p>
                        <ClientSelector clients={availableClients} activeClientId={activeClientId} />
                    </div>
                ) : (
                    <div>No client associated with this account.</div>
                )}
            </div>
        );
    }

    // Check Entitlements (New)
    const { data: plan } = await supabase.from('display_client_plans').select('specials_studio_enabled, design_package_included, managed_design_support').eq('client_id', activeClientId).single();
    // Default false if no plan found (safe default)
    const isEnabled = plan?.specials_studio_enabled || plan?.design_package_included || plan?.managed_design_support || false;

    if (!isEnabled) {
        const { UpgradeGate } = await import('@/components/billing/UpgradeGate');
        return (
            <div className="p-8 h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Specials Studio</h1>
                        <p className="text-gray-500">Manage digital signage content.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                        {role?.role === 'super_admin' && (
                            <ClientSelector clients={availableClients} activeClientId={activeClientId} />
                        )}
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <UpgradeGate
                        title="Specials Studio Included in Onesign Video"
                        description="Unlock our powerful drag-and-drop editor with designer-approved templates."
                    />
                </div>
            </div>
        );
    }

    const projects = await getSpecialsProjects(activeClientId);

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-zinc-900">Specials Studio</h1>
                        <HelpIcon section="specials" />
                    </div>
                    <p className="text-gray-500">Manage digital signage content.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    {role?.role === 'super_admin' && (
                        <ClientSelector clients={availableClients} activeClientId={activeClientId} />
                    )}
                    <Link
                        href={`/app/specials/new?clientId=${activeClientId}`}
                        className="bg-black text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={18} />
                        Prepare Screen
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 mb-4">No specials created for this client yet</p>
                        <Link href={`/app/specials/new?clientId=${activeClientId}`} className="text-blue-600 hover:underline">Create your first special</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
