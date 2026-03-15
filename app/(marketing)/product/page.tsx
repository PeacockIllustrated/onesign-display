import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { NumberedSteps } from "@/components/marketing/NumberedSteps";
import Link from "next/link";
import { LayoutTemplate, DollarSign, Calendar, Wifi } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'How Onesign Display works',
    description: 'From kitchen to screen in four simple steps. Menu boards that run themselves.',
};

export default function ProductPage() {
    return (
        <>
            <MarketingHero
                headline="Menu boards that run themselves."
                subhead="From breakfast to late-night, Onesign automatically streams the right menu to the right screen at the right time."
                primaryCta={{ href: "/contact", label: "Book a Demo" }}
            />

            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">The Menu Update Nightmare</h2>
                        <p className="text-neutral-500 mb-6 leading-relaxed">
                            USB sticks. Outdated specials. Staff who don't know how to "use the TV." Sound familiar?
                        </p>
                        <p className="text-neutral-500 leading-relaxed">
                            Onesign eliminates the friction between your kitchen and your screens. Change a price, update a special, schedule your dayparts—all from one dashboard, synced to every screen in seconds.
                        </p>
                    </div>
                    <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-red-100 shadow-sm opacity-50">
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                    <span className="font-bold text-lg">?</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900">The Old Way</h4>
                                    <p className="text-xs text-neutral-500">USB sticks, outdated content, IT tickets</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-200 shadow-md">
                                <div className="h-10 w-10 bg-neutral-950 rounded-full flex items-center justify-center text-white">
                                    <Wifi className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900">Onesign Streaming</h4>
                                    <p className="text-xs text-neutral-500">Update once, sync everywhere, instantly</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold mb-4">How menu streaming works</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-950 mb-6">
                            <LayoutTemplate className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold mb-2">1. Menus</h3>
                        <p className="text-sm text-neutral-500">Upload your menu layouts or use our templates.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-950 mb-6">
                            <DollarSign className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold mb-2">2. Prices & Specials</h3>
                        <p className="text-sm text-neutral-500">Your team updates content in simple forms.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-950 mb-6">
                            <Calendar className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold mb-2">3. Schedule</h3>
                        <p className="text-sm text-neutral-500">Breakfast at 6am, lunch at 11am, dinner at 5pm—automatic.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-950 mb-6">
                            <Wifi className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold mb-2">4. Stream</h3>
                        <p className="text-sm text-neutral-500">Content flows to your screens. Offline backup included.</p>
                    </div>
                </div>

            </SectionWrapper>

            <SectionWrapper dark className="text-center">
                <h2 className="text-3xl font-bold mb-8">Stop juggling USB sticks. Start streaming your menus.</h2>
                <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-neutral-950 shadow-sm hover:bg-neutral-200 transition-colors"
                >
                    Get Started
                </Link>
            </SectionWrapper>

        </>
    );
}

