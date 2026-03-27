import Link from "next/link";
import Image from "next/image";
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
    variant?: "light" | "dark";
}

export function MarketingHero({
    pill,
    headline,
    subhead,
    primaryCta,
    secondaryCta,
    children,
    variant = "light",
}: MarketingHeroProps) {
    const isDark = variant === "dark";

    return (
        <div
            className="relative overflow-hidden"
            style={
                isDark
                    ? {
                          background:
                              "linear-gradient(135deg, #1a2e35 0%, #2a4a54 40%, #1a2e35 100%)",
                      }
                    : undefined
            }
        >
            {/* Dark variant: subtle radial glow */}
            {isDark && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(78,126,140,0.15) 0%, transparent 70%)",
                    }}
                />
            )}

            {/* Light variant: grid pattern */}
            {!isDark && (
                <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
            )}

            <div className="relative z-10 pt-20 pb-32 md:pt-32 md:pb-48">
                <SectionWrapper
                    className={
                        isDark
                            ? "!py-0 !bg-transparent !text-white"
                            : "!py-0 !bg-transparent"
                    }
                >
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
                        {pill && (
                            <div
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-8 backdrop-blur-sm ${
                                    isDark
                                        ? "border-white/20 bg-white/10 text-white/80"
                                        : "border-neutral-200 bg-neutral-50 text-neutral-600"
                                }`}
                                style={{
                                    animation: "heroFadeUp 0.6s ease-out both",
                                    animationDelay: "0.1s",
                                }}
                            >
                                <span
                                    className={`flex h-2 w-2 rounded-full mr-2 ${
                                        isDark ? "bg-[#4e7e8c]" : "bg-neutral-950"
                                    }`}
                                />
                                {pill}
                            </div>
                        )}

                        <h1
                            className={`text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.08] ${
                                isDark ? "text-white" : "text-neutral-950"
                            }`}
                            style={{
                                animation: "heroFadeUp 0.6s ease-out both",
                                animationDelay: "0.2s",
                            }}
                        >
                            {headline}
                        </h1>

                        {subhead && (
                            <p
                                className={`text-lg md:text-xl mb-10 leading-relaxed max-w-2xl ${
                                    isDark ? "text-white/60" : "text-neutral-500"
                                }`}
                                style={{
                                    animation: "heroFadeUp 0.6s ease-out both",
                                    animationDelay: "0.35s",
                                }}
                            >
                                {subhead}
                            </p>
                        )}

                        <div
                            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                            style={{
                                animation: "heroFadeUp 0.6s ease-out both",
                                animationDelay: "0.5s",
                            }}
                        >
                            {primaryCta && (
                                <Link
                                    href={primaryCta.href}
                                    className={`inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-medium shadow-sm transition-colors ${
                                        isDark
                                            ? "bg-white text-neutral-950 hover:bg-neutral-100"
                                            : "bg-neutral-950 text-white hover:bg-neutral-800"
                                    }`}
                                >
                                    {primaryCta.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            )}
                            {secondaryCta && (
                                <Link
                                    href={secondaryCta.href}
                                    className={`inline-flex items-center justify-center rounded-lg border px-8 py-4 text-base font-medium transition-colors ${
                                        isDark
                                            ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
                                            : "border-neutral-200 bg-white text-neutral-950 shadow-sm hover:bg-neutral-50"
                                    }`}
                                >
                                    {secondaryCta.label}
                                </Link>
                            )}
                        </div>
                    </div>

                    {children && (
                        <div
                            className="relative w-full"
                            style={{
                                animation: "heroFadeUp 0.8s ease-out both",
                                animationDelay: "0.65s",
                            }}
                        >
                            {children}
                        </div>
                    )}
                </SectionWrapper>
            </div>

            {/* Keyframes injected via style tag */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes heroFadeUp {
                            from {
                                opacity: 0;
                                transform: translateY(24px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `,
                }}
            />
        </div>
    );
}
