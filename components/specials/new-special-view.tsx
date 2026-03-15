'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSpecialsProject } from '@/app/app/specials/actions';
import { TEMPLATES } from '@/components/specials/Templates';
import { Loader2 } from 'lucide-react';
import { ClientSelector } from '@/components/portal/client-selector';
import { Suspense } from 'react';

interface Props {
    clients?: { id: string; name: string }[];
    userClientId?: string; // If Client Admin, this is their ID. If Super Admin, this is undefined.
    customTemplates?: any[];
}

export function NewSpecialView({ clients = [], userClientId, customTemplates = [] }: Props) {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <Content clients={clients} userClientId={userClientId} customTemplates={customTemplates} />
        </Suspense>
    );
}

function Content({ clients = [], userClientId, customTemplates = [] }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [submitting, setSubmitting] = useState(false);

    // Determine effective Client ID
    // 1. URL Param (highest priority)
    // 2. User's Client ID (if client admin)
    // 3. First available client (if super admin fallback)
    const urlClientId = searchParams.get('clientId');
    const effectiveClientId = urlClientId || userClientId || clients[0]?.id;

    const handleCreate = async (template: any) => {
        if (!effectiveClientId) {
            alert('Please select a client first.');
            return;
        }

        setSubmitting(true);
        try {
            const projectId = await createSpecialsProject(
                effectiveClientId,
                `${template.name} Copy`,
                template.canvas_preset,
                template.design_json
            );

            router.push(`/app/specials/${projectId}`);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to create project: ${e.message}`);
            setSubmitting(false);
        }
    };

    const allTemplates = [...customTemplates, ...TEMPLATES];

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-2 uppercase tracking-wide">Specials Studio</h1>
                    <p className="text-gray-500">Select a template to prepare your screen.</p>
                </div>

                {/* Show Client Selector if multiple clients available (Super Admin) */}
                {clients.length > 0 && (
                    <div className="w-full md:w-auto">
                        <label className="block text-xs text-xs font-bold uppercase text-gray-400 mb-1">Creating for Client:</label>
                        <ClientSelector clients={clients} activeClientId={effectiveClientId} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {allTemplates.map((tmpl, i) => (
                    <button
                        key={i}
                        disabled={submitting}
                        onClick={() => handleCreate(tmpl)}
                        className="border rounded-lg p-4 hover:border-black text-left transition-all hover:shadow-md bg-white group relative overflow-hidden"
                    >
                        <div className="absolute top-3 right-3 z-10">
                            <span className="bg-black/5 text-black/60 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                {(tmpl.canvas_preset || 'landscape_1080').includes('portrait') ? 'Portrait' : 'Landscape'}
                            </span>
                        </div>

                        <div className="bg-gray-100 rounded mb-4 aspect-video flex items-center justify-center text-gray-400 text-xs overflow-hidden relative">
                            {tmpl.thumbnail_url ? (
                                <img src={tmpl.thumbnail_url} alt={tmpl.name} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gray-50 group-hover:bg-gray-100 transition-colors" />
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <div className="w-4 h-4 bg-zinc-200 rounded-sm" />
                                        </div>
                                        <span className="font-medium text-zinc-400">Preview</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{tmpl.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">{(tmpl.canvas_preset || 'landscape_1080').replace('_', ' ')}</p>
                    </button>
                ))}
            </div>

            {submitting && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            )}
        </div>
    );
}
