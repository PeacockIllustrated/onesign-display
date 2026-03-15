import { Entitlements, getPlanDisplayName, getPlanIncludedFeatures } from '@/lib/slate/plans';
import Link from 'next/link';

interface PlanReadoutProps {
    entitlements: Entitlements;
    screenCount: number;
}

export function PlanReadout({ entitlements, screenCount }: PlanReadoutProps) {
    const features = getPlanIncludedFeatures(entitlements);
    const isUnlimited = entitlements.max_screens >= 9999;
    const usagePercent = isUnlimited ? 0 : Math.min(100, (screenCount / entitlements.max_screens) * 100);

    const statusColor = entitlements.status === 'active'
        ? 'bg-zinc-900 text-white hover:bg-zinc-700'
        : 'bg-red-500 text-white hover:bg-red-600';

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-extrabold uppercase tracking-wide text-zinc-900">{getPlanDisplayName(entitlements.plan_code)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${statusColor} border-transparent shadow`}>
                            {entitlements.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors"
                >
                    Upgrade Plan
                </Link>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Screen Usage</span>
                    <span className="font-medium text-zinc-900">
                        {screenCount} / {isUnlimited ? '∞' : entitlements.max_screens}
                    </span>
                </div>
                {!isUnlimited && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className="h-full bg-zinc-900 transition-all"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                )}
                {screenCount >= entitlements.max_screens && !isUnlimited && (
                    <p className="text-xs text-red-600 font-medium">
                        Plan limit reached. Upgrade to add more screens.
                    </p>
                )}
            </div>

            <div>
                <h4 className="text-sm font-medium mb-3 text-zinc-900">Included Features</h4>
                <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                        <span key={feature} className="inline-flex items-center rounded-full border border-transparent bg-zinc-100 px-3 py-1 text-xs font-normal text-zinc-900 hover:bg-zinc-200 transition-colors">
                            {feature}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
