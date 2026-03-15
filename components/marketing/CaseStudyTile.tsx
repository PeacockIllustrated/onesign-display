import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CaseStudyProps {
    client: string;
    metric: string;
    description: string;
    href: string;
}

export function CaseStudyTile({ client, metric, description, href }: CaseStudyProps) {
    return (
        <Link href={href} className="group block bg-neutral-50 p-8 rounded-xl hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200">
            <div className="flex justify-between items-start mb-6">
                <h4 className="font-semibold text-neutral-950 text-lg">{client}</h4>
                <ArrowUpRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-950 transition-colors" />
            </div>
            <div className="mb-4">
                <span className="text-4xl font-bold text-neutral-950 block mb-1">{metric}</span>
                <span className="text-sm text-neutral-500">{description}</span>
            </div>
            <div className="text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 group-hover:decoration-neutral-950 transition-all">
                Read case study
            </div>
        </Link>
    );
}
