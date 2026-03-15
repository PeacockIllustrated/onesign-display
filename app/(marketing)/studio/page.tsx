import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Specials Studio — Onesign Display',
    description: 'Create eye-catching daily specials in 30 seconds. No design skills required.',
};

export default function StudioPage() {
    return (
        <>
            <MarketingHero
                pill="Now Available"
                headline="Specials Studio"
                subhead="Create eye-catching daily specials in seconds. No design skills required—just fill in the blanks."
                primaryCta={{ href: "/contact", label: "Request Access" }}
            />

            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Today's special?<br />Done in 30 seconds.</h2>
                        <p className="text-neutral-500 mb-6">
                            Enter your dish name, price, and optional photo. Onesign handles the layout, typography, and styling automatically. Every special looks professional—every time.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Fill-in-the-blank simplicity",
                                "Always on-brand results",
                                "Photo auto-formatting",
                                "Automatic price formatting",
                                "Built-in image library"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full bg-neutral-950 flex items-center justify-center text-white shrink-0">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-neutral-100 rounded-2xl border border-neutral-200 aspect-square flex items-center justify-center text-neutral-400">
                        {/* Visual placeholder for the editor UI */}
                        <span className="font-mono text-sm">[Editor UI Placeholder]</span>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper className="bg-neutral-50">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">Your team focuses on food. Onesign handles the design.</h2>
                    <p className="text-neutral-500">
                        By removing design tools from the equation, we eliminate user error. Your staff enters the daily specials—the system makes them look amazing.
                    </p>
                </div>
            </SectionWrapper>
        </>
    );
}

