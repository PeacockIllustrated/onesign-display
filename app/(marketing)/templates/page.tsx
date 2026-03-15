import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { ScreenPreviewFrame } from "@/components/marketing/ScreenPreviewFrame";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Menu Templates — Onesign Display',
    description: 'Pre-built digital menu layouts designed by the Onesign Display team.',
};

export default function TemplatesPage() {
    const templates = [
        { name: "Coffee Board V2", category: "Menu Board" },
        { name: "Burger Promo Lg", category: "Promo" },
        { name: "Drive-Thru A", category: "Digital" },
        { name: "Lobby Portrait", category: "Signage" },
        { name: "Bar List Dark", category: "Menu Board" },
        { name: "Weekend Special", category: "Promo" }
    ];

    return (
        <>
            <MarketingHero
                headline="Menu Templates"
                subhead="Beautiful menu layouts ready to use. Pick a style, add your items, and you're live."
                primaryCta={{ href: "/contact", label: "Book a Demo" }}
            />

            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.map((t, i) => (
                        <div key={i} className="group cursor-default">
                            <ScreenPreviewFrame caption={`${t.category} • ${t.name}`} />
                        </div>
                    ))}
                </div>
            </SectionWrapper>
        </>
    );
}
