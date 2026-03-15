import Link from "next/link";
import { SectionWrapper } from "./SectionWrapper";
import { ArrowRight } from "lucide-react";

interface MarketingHeroProps {
    pill?: string;
    headline: string;
    subhead?: string;
    primaryCta?: {
        href: string;
        label: string;
    };
    secondaryCta?: {
        href: string;
        label: string;
    };
    children?: React.ReactNode;
}

export function MarketingHero({
    pill,
    headline,
    subhead,
    primaryCta,
    secondaryCta,
    children,
}: MarketingHeroProps) {
    return (
        <div className="relative pt-20 pb-32 md:pt-32 md:pb-48 bg-white overflow-hidden">
            <SectionWrapper className="!py-0 relative z-10">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                    {pill && (
                        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm font-medium text-neutral-600 mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-neutral-950 mr-2" />
                            {pill}
                        </div>
                    )}

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-950 mb-8 leading-[1.1]">
                        {headline}
                    </h1>

                    {subhead && (
                        <p className="text-xl text-neutral-500 mb-10 leading-relaxed max-w-2xl">
                            {subhead}
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        {primaryCta && (
                            <Link
                                href={primaryCta.href}
                                className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-8 py-4 text-base font-medium text-white shadow-sm hover:bg-neutral-800 transition-colors"
                            >
                                {primaryCta.label}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        )}
                        {secondaryCta && (
                            <Link
                                href={secondaryCta.href}
                                className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-8 py-4 text-base font-medium text-neutral-950 shadow-sm hover:bg-neutral-50 transition-colors"
                            >
                                {secondaryCta.label}
                            </Link>
                        )}
                    </div>
                </div>

                {children && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-neutral-200 shadow-2xl bg-neutral-50">
                        {children}
                    </div>
                )}
            </SectionWrapper>

            {/* Subtle Background Grid Pattern */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        </div>
    );
}
