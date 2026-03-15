'use client';

import { useState, useTransition } from 'react';
import { updateProspectNotes } from '@/app/actions/prospect-actions';
import { Check, Loader2 } from 'lucide-react';

export function ProspectNotesEditor({ prospectId, initialNotes }: { prospectId: string; initialNotes: string }) {
    const [notes, setNotes] = useState(initialNotes);
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            await updateProspectNotes(prospectId, notes);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div className="space-y-3">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this prospect (follow-up dates, call notes, etc.)..."
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none text-sm"
            />
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={isPending || notes === initialNotes}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Notes'
                    )}
                </button>
                {saved && (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        Saved
                    </span>
                )}
            </div>
        </div>
    );
}
