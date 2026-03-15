'use client';

import { useState } from 'react';
import { PlanCode, PLAN_DEFS } from '@/lib/slate/plans';
import { updateClientPlan } from '@/app/actions/admin-plan';
import { Loader2, Check } from 'lucide-react';

interface PlanSettingsFormProps {
    clientId: string;
    initialPlan: any;
    screenCount: number;
}

export function PlanSettingsForm({ clientId, initialPlan, screenCount }: PlanSettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [currentPlanCode, setCurrentPlanCode] = useState<PlanCode>(initialPlan.plan_code);
    const [overrides, setOverrides] = useState({
        maxScreens: initialPlan.max_screens,
        videoEnabled: initialPlan.video_enabled,
        specialsEnabled: initialPlan.specials_studio_enabled,
        schedulingEnabled: initialPlan.scheduling_enabled,
        fourKEnabled: initialPlan.four_k_enabled,
        designPackage: initialPlan.design_package_included,
        managedSupport: initialPlan.managed_design_support,
    });

    const handlePlanChange = (code: PlanCode) => {
        setCurrentPlanCode(code);
        const defs = PLAN_DEFS[code];
        setOverrides({
            maxScreens: defs.max_screens,
            videoEnabled: defs.video_enabled,
            specialsEnabled: defs.specials_studio_enabled,
            schedulingEnabled: defs.scheduling_enabled,
            fourKEnabled: defs.four_k_enabled,
            designPackage: defs.design_package_included,
            managedSupport: defs.managed_design_support,
        });
    };

    const applyDefaults = () => {
        const defs = PLAN_DEFS[currentPlanCode];
        setOverrides({
            maxScreens: defs.max_screens,
            videoEnabled: defs.video_enabled,
            specialsEnabled: defs.specials_studio_enabled,
            schedulingEnabled: defs.scheduling_enabled,
            fourKEnabled: defs.four_k_enabled,
            designPackage: defs.design_package_included,
            managedSupport: defs.managed_design_support,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const res = await updateClientPlan(formData);

        setLoading(false);
        if (res.error) {
            alert(res.error);
        } else {
            alert('Plan updated successfully');
        }
    };

    // Warn if screen limit warning
    const isReducingLimit = overrides.maxScreens < screenCount;

    const renderCheckbox = (name: string, label: string, checked: boolean, onChange: (val: boolean) => void) => (
        <label className="flex items-center gap-3 p-3 border-2 border-transparent hover:border-zinc-100 rounded-lg transition-colors cursor-pointer -ml-3 group">
            <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300 bg-white group-hover:border-zinc-900'}`}>
                {checked && <Check size={16} className="text-white" strokeWidth={3} />}
            </div>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only" // Hide default
            />
            <span className={`text-sm font-bold transition-colors ${checked ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'}`}>{label}</span>
        </label>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
            <input type="hidden" name="clientId" value={clientId} />

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Plan</label>
                    <div className="relative">
                        <select
                            name="planCode"
                            value={currentPlanCode}
                            onChange={(e) => handlePlanChange(e.target.value as PlanCode)}
                            className="w-full rounded-md border-2 border-zinc-200 bg-white p-3 text-sm text-zinc-900 font-bold focus:border-black focus:ring-black outline-none transition-colors appearance-none"
                        >
                            <option value="static_design">Static + Design</option>
                            <option value="video_design_system">Video + Design System</option>
                            <option value="pro_managed">Pro Managed</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-700">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Status</label>
                    <div className="relative">
                        <select
                            name="status"
                            defaultValue={initialPlan.status}
                            className="w-full rounded-md border-2 border-zinc-200 bg-white p-3 text-sm text-zinc-900 font-bold focus:border-black focus:ring-black outline-none transition-colors appearance-none"
                        >
                            <option value="active">Active</option>
                            <option value="past_due">Past Due</option>
                            <option value="paused">Paused</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-700">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={applyDefaults}
                    className="text-xs font-bold uppercase tracking-wide text-zinc-900 border-b-2 border-zinc-200 hover:border-black transition-colors pb-0.5"
                >
                    Reset Overrides to {currentPlanCode} Defaults
                </button>
            </div>

            <div className="space-y-4 border-t-2 border-zinc-100 pt-6">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-zinc-900">Entitlements</h3>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Max Screens</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            name="maxScreens"
                            value={overrides.maxScreens}
                            onChange={e => setOverrides(prev => ({ ...prev, maxScreens: parseInt(e.target.value) }))}
                            className={`w-32 rounded-md border-2 p-3 text-sm font-bold outline-none transition-colors ${isReducingLimit
                                    ? 'border-red-300 bg-red-50 text-red-900'
                                    : 'border-zinc-200 text-zinc-900 focus:border-black'
                                }`}
                        />
                        <span className="text-sm text-zinc-500 whitespace-nowrap font-medium">Currently Using: <span className="text-zinc-900 font-bold">{screenCount}</span></span>
                    </div>
                    {isReducingLimit && (
                        <p className="text-xs font-bold text-red-600 mt-2 uppercase tracking-wide">
                            Warning: Limit is below current usage.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {renderCheckbox('videoEnabled', 'Video Enabled', overrides.videoEnabled, (c) => setOverrides(p => ({ ...p, videoEnabled: c })))}
                    {renderCheckbox('specialsEnabled', 'Specials Studio', overrides.specialsEnabled, (c) => setOverrides(p => ({ ...p, specialsEnabled: c })))}
                    {renderCheckbox('schedulingEnabled', 'Scheduling', overrides.schedulingEnabled, (c) => setOverrides(p => ({ ...p, schedulingEnabled: c })))}
                    {renderCheckbox('fourKEnabled', '4K Support', overrides.fourKEnabled, (c) => setOverrides(p => ({ ...p, fourKEnabled: c })))}
                    {renderCheckbox('designPackage', 'Design Package', overrides.designPackage, (c) => setOverrides(p => ({ ...p, designPackage: c })))}
                    {renderCheckbox('managedSupport', 'Managed Support', overrides.managedSupport, (c) => setOverrides(p => ({ ...p, managedSupport: c })))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Internal Notes</label>
                <textarea
                    name="notes"
                    defaultValue={initialPlan.notes}
                    className="w-full rounded-md border-2 border-zinc-200 p-3 text-sm text-zinc-900 font-medium focus:border-black focus:ring-black outline-none transition-colors h-24 resize-none placeholder:text-zinc-400"
                    placeholder="Internal deployment notes..."
                />
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-8 py-3 rounded-lg hover:bg-zinc-800 font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                    {loading && <Loader2 className="animate-spin h-4 w-4" />}
                    Save Configuration
                </button>
            </div>
        </form>
    );
}
