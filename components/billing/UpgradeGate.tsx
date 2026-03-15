import { Lock } from 'lucide-react';
import Link from 'next/link';

interface UpgradeGateProps {
    title?: string;
    description?: string;
    minPlan?: string;
}

export function UpgradeGate({
    title = "Feature Included in Onesign Video",
    description = "This feature requires a plan upgrade. Access designer-approved templates, video support, and more.",
    minPlan = "Onesign Video"
}: UpgradeGateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-100 border border-dashed border-zinc-300 rounded-lg h-full min-h-[300px]">
            <div className="h-12 w-12 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-zinc-900">{title}</h3>
            <p className="text-zinc-500 max-w-md mb-6">{description}</p>

            <div className="flex gap-3">
                <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                >
                    Request Upgrade
                </Link>
                <Link
                    href="/app/settings/plan"
                    className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-transparent px-4 py-2 text-sm font-medium shadow-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                >
                    View Plans
                </Link>
            </div>
        </div>
    );
}
