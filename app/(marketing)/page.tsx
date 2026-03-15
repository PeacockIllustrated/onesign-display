import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { NumberedSteps } from "@/components/marketing/NumberedSteps";
import Link from "next/link";
import { ArrowRight, Zap, RotateCcw, Monitor, UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Stream your menus. Schedule your day. — Onesign Display',
    description: 'The digital menu platform built for busy hospitality teams. Update prices, swap specials, and schedule content in seconds.',
};

export default function MarketingHome() {
    return (
        <>
            <MarketingHero
                pill="Digital Menu Boards"
                headline="Stream your menus. Schedule your day."
                subhead="The menu display platform built for busy hospitality teams. Update prices, swap specials, and schedule content—all in seconds."
                primaryCta={{ href: "/contact", label: "Book a Demo" }}
                secondaryCta={{ href: "/product", label: "See how it works" }}
            >
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                    <div className="text-center">
                        <span className="block text-white/40 font-mono text-sm mb-2">STREAMING LIVE</span>
                        <span className="text-3xl font-bold text-white tracking-widest">LUNCH MENU</span>
                        <span className="block text-green-500 font-mono text-xs mt-4">● Synced 2m ago</span>
                    </div>
                </div>
            </MarketingHero>

            <SectionWrapper dark>
                <div className="max-w-3xl">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                        Menus that update themselves.
                    </h2>
                    <p className="text-xl text-neutral-400 leading-relaxed">
                        Tired of USB sticks, print runs, and outdated boards? Onesign streams your menu content directly to your screens—live, scheduled, or on-demand. Your breakfast menu at 6am, lunch at 11am, dinner at 5pm. Automatically.
                    </p>
                </div>
            </SectionWrapper>

            <SectionWrapper>
                <div className="mb-20">
                    <h2 className="text-3xl font-bold mb-4">How Onesign works</h2>
                    <p className="text-neutral-500 max-w-xl">From kitchen to screen in four simple steps.</p>
                </div>
                <NumberedSteps
                    steps={[
                        {
                            title: "Pick your menu layout",
                            description: "Start with beautiful, pre-built menu templates. No design skills needed.",
                        },
                        {
                            title: "Update prices & items",
                            description: "Change a price, add a special, swap an image—takes 30 seconds.",
                        },
                        {
                            title: "Schedule it",
                            description: "Set your breakfast, lunch, and dinner menus to switch automatically.",
                        },
                        {
                            title: "Stream to screens",
                            description: "Content syncs instantly. Every screen. Every location.",
                        },
                    ]}
                />
            </SectionWrapper>

            <SectionWrapper className="bg-neutral-50">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold mb-4">Built for your team, not IT.</h2>
                    <p className="text-neutral-500">
                        Features that make menu management foolproof—so any staff member can help.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="p-8 bg-white rounded-2xl border border-neutral-200">
                        <Zap className="h-8 w-8 text-neutral-950 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Foolproof Editing</h3>
                        <p className="text-neutral-500">
                            Staff can update prices and specials without accidentally breaking the layout.
                            Simple forms, not design tools.
                        </p>
                    </div>

                    <div className="p-8 bg-white rounded-2xl border border-neutral-200">
                        <RotateCcw className="h-8 w-8 text-neutral-950 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Undo Mistakes Instantly</h3>
                        <p className="text-neutral-500">
                            Wrong price? One click rolls back to the previous version.
                            Complete history of every change, every screen.
                        </p>
                    </div>

                    <div className="p-8 bg-white rounded-2xl border border-neutral-200">
                        <Monitor className="h-8 w-8 text-neutral-950 mb-6" />
                        <h3 className="text-xl font-bold mb-3">See Every Screen</h3>
                        <p className="text-neutral-500">
                            Real-time view of what's playing at every location.
                            Get alerts if a screen goes offline.
                        </p>
                    </div>

                    <div className="p-8 bg-white rounded-2xl border border-neutral-200">
                        <UserCheck className="h-8 w-8 text-neutral-950 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Manager Approval</h3>
                        <p className="text-neutral-500">
                            Optional sign-off before changes go live.
                            Perfect for franchise operations.
                        </p>
                    </div>
                </div>
            </SectionWrapper>



            <SectionWrapper dark className="text-center">
                <h2 className="text-4xl font-bold mb-8">Ready to ditch the USB sticks?</h2>
                <p className="text-neutral-400 mb-10 max-w-xl mx-auto">
                    Join hundreds of restaurants streaming smarter menus. No IT team required.
                </p>
                <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-neutral-950 shadow-sm hover:bg-neutral-200 transition-colors"
                >
                    Book a Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </SectionWrapper>
        </>
    );
}
