'use client';

import { useState, useTransition } from 'react';
import { updateProspectStatus } from '@/app/actions/prospect-actions';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    new: { label: 'New', className: 'bg-blue-100 text-blue-800' },
    contacted: { label: 'Contacted', className: 'bg-yellow-100 text-yellow-800' },
    demo_scheduled: { label: 'Demo Scheduled', className: 'bg-purple-100 text-purple-800' },
    converted: { label: 'Converted', className: 'bg-green-100 text-green-800' },
    lost: { label: 'Lost', className: 'bg-zinc-100 text-zinc-500' },
};

const STATUS_OPTIONS = ['new', 'contacted', 'demo_scheduled', 'converted', 'lost'] as const;

export function ProspectStatusBadge({ status, prospectId }: { status: string; prospectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;

    const handleStatusChange = (newStatus: string) => {
        setIsOpen(false);
        startTransition(async () => {
            await updateProspectStatus(prospectId, newStatus);
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${config.className} ${isPending ? 'opacity-50' : ''}`}
            >
                {isPending ? 'Updating...' : config.label}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 ${s === status ? 'font-medium bg-zinc-50' : ''
                                    }`}
                            >
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_CONFIG[s].className.split(' ')[0]}`} />
                                {STATUS_CONFIG[s].label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
