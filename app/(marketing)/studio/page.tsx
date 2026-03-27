import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { LaptopCarousel } from "@/components/marketing/LaptopCarousel";
import { LayoutTemplate, PenLine, Eye, Send, Check, ArrowRight, Sparkles, Camera, DollarSign, Palette } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Specials Studio — Onesign Display",
    description:
        "Create eye-catching daily specials in 30 seconds. No design skills required.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const steps = [
    {
        icon: LayoutTemplate,
        title: "Pick a Template",
        description: "Choose from professionally designed layouts built by the Onesign team.",
    },
    {
        icon: PenLine,
        title: "Fill in Details",
        description: "Dish name, price, photo, description — just fill in the blanks.",
    },
    {
        icon: Eye,
        title: "Preview Live",
        description: "See exactly how it looks on screen before publishing.",
    },
    {
        icon: Send,
        title: "Publish",
        description: "One click to your media library and every connected screen.",
    },
];

const benefits = [
    {
        icon: Sparkles,
        title: "No design tools needed",
        description:
            "Your staff don't need Canva, Photoshop, or any design experience. The template does the heavy lifting.",
    },
    {
        icon: Palette,
        title: "Always on-brand",
        description:
            "Every special matches your brand identity. Fonts, colours, and layout are locked in by the Onesign team.",
    },
    {
        icon: Camera,
        title: "Photo auto-formatting",
        description:
            "Upload any photo and the system crops, positions, and colour-corrects it to fit the template perfectly.",
    },
    {
        icon: DollarSign,
        title: "Automatic price formatting",
        description:
            "Prices are always typeset correctly — no stray decimals, no misaligned columns, no guesswork.",
    },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function StudioPage() {
    return (
        <>
            {/* ---- Hero ---- */}
            <MarketingHero
                pill="Specials Studio"
                headline="Today's Special? Done in 30 Seconds"
                subhead="No design skills required. No blank canvas. No agency wait. Just fill in the blanks and hit publish."
                primaryCta={{ href: "/contact", label: "Book a Demo" }}
                secondaryCta={{ href: "/pricing", label: "View Pricing" }}
            />

            {/* ---- How It Works ---- */}
            <SectionWrapper>
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Four steps. Thirty seconds.
                    </h2>
                    <p className="text-neutral-500 text-lg leading-relaxed">
                        From blank to on-screen in the time it takes to pull an
                        espresso.
                    </p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
                    {/* Connector line (desktop only) */}
                    <div
                        aria-hidden
                        className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-neutral-200"
                    />

                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.title}
                                className="relative flex flex-col items-center text-center"
                            >
                                {/* Step circle */}
                                <div className="relative z-10 h-20 w-20 rounded-full bg-neutral-950 flex items-center justify-center text-white mb-6 shadow-lg shadow-neutral-950/10">
                                    <Icon className="h-8 w-8" />
                                </div>

                                {/* Arrow between steps (mobile: vertical, desktop: hidden because line handles it) */}
                                {i < steps.length - 1 && (
                                    <div className="md:hidden flex justify-center my-2 text-neutral-300">
                                        <ArrowRight className="h-5 w-5 rotate-90" />
                                    </div>
                                )}

                                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                                    Step {i + 1}
                                </span>
                                <h3 className="text-lg font-bold mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-neutral-500 leading-relaxed max-w-[220px]">
                                    {step.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </SectionWrapper>

            {/* ---- Screenshot in laptop ---- */}
            <SectionWrapper className="!pt-0">
                <div className="relative mx-auto max-w-5xl">
                    <LaptopCarousel
                        slides={[
                            { src: '/marketing/screenshot-specials-studio.png', alt: 'Specials Studio — template picker and live canvas preview' },
                            { src: '/marketing/screenshot-media-library.png', alt: 'Media library — publish specials directly to your library' },
                        ]}
                        interval={5000}
                    />
                </div>

                <p className="text-center text-sm text-neutral-400 mt-2">
                    Specials Studio — layers, live canvas preview, and one-click
                    publish
                </p>
            </SectionWrapper>

            {/* ---- Benefits ---- */}
            <SectionWrapper className="bg-neutral-50">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Your team focuses on food.
                        <br />
                        Onesign handles the design.
                    </h2>
                    <p className="text-neutral-500 text-lg leading-relaxed">
                        By removing design tools from the equation, we eliminate
                        user error. Your staff enters the daily specials — the
                        system makes them look amazing.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {benefits.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                            <div
                                key={benefit.title}
                                className="flex gap-5 p-6 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 transition-colors"
                            >
                                <div className="h-12 w-12 shrink-0 rounded-xl bg-neutral-950 flex items-center justify-center text-white">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold mb-1">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionWrapper>

            {/* ---- Use Cases ---- */}
            <SectionWrapper>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Built for the people who actually update the board
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed max-w-2xl mx-auto">
                            Specials Studio is designed for front-of-house teams,
                            not graphic designers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                label: "Cafe Manager",
                                scenario:
                                    "Updates the soup of the day before the morning rush, straight from her phone.",
                            },
                            {
                                label: "Head Chef",
                                scenario:
                                    "Adds the evening specials with photos during afternoon prep. Published in seconds.",
                            },
                            {
                                label: "Operations Director",
                                scenario:
                                    "Rolls out a new seasonal special across 12 locations from one dashboard.",
                            },
                        ].map((persona) => (
                            <div
                                key={persona.label}
                                className="p-6 rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-colors"
                            >
                                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                                    {persona.label}
                                </span>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    {persona.scenario}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- Bottom CTA ---- */}
            <SectionWrapper dark className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Ready to kill the whiteboard specials?
                </h2>
                <p className="text-neutral-400 text-lg mb-10 max-w-xl mx-auto">
                    See Specials Studio in action with a live demo tailored to
                    your venue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-neutral-950 shadow-sm hover:bg-neutral-100 transition-colors"
                    >
                        Book a Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-8 py-4 text-base font-medium text-white hover:bg-neutral-800 transition-colors"
                    >
                        View Pricing
                    </Link>
                </div>
            </SectionWrapper>
        </>
    );
}
