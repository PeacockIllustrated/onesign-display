import React, { useState } from 'react';
import { Loader2, Monitor, Calendar } from 'lucide-react';
import { SpecialsProject, CANVAS_PRESETS } from './types';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPublish: () => void;
    project: SpecialsProject;
    saving: boolean;
}

export function PublishModal({ isOpen, onClose, onPublish, project, saving }: PublishModalProps) {
    if (!isOpen) return null;

    const preset = CANVAS_PRESETS[project.canvas_preset as keyof typeof CANVAS_PRESETS] || CANVAS_PRESETS.landscape_1080;
    const isPortrait = project.canvas_preset.includes('portrait');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-bold uppercase tracking-wide">Publish to Screens</h2>
                    <p className="text-sm text-gray-500 mt-1">Review details before updating displays.</p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Summary Card */}
                    <div className="bg-zinc-50 rounded border p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white border rounded shadow-sm text-zinc-500">
                                <Monitor size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Target Screen Context</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isPortrait ? 'Portrait Orientation' : 'Landscape Orientation'} • {preset.width}x{preset.height}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-200 flex items-start gap-3">
                            <div className="p-2 bg-white border rounded shadow-sm text-zinc-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Schedule</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Immediate update. Content will play according to screen loop settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100">
                        <strong>Confirmation:</strong> This action will generate a new media asset and push it to all linked screens.
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 border-t flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onPublish}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium bg-black text-white hover:bg-zinc-800 rounded flex items-center gap-2"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        Confirm & Publish
                    </button>
                </div>
            </div>
        </div>
    );
}
