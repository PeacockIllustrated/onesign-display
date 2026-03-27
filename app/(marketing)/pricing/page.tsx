import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Check, X, ChevronDown, ArrowRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Digital Menu Board Pricing — Onesign Display",
    description:
        "Simple monthly pricing. Every plan includes scheduling, unlimited updates, and Onesign design included.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tiers = [
    {
        name: "Onesign Static",
        description: "Single-location cafes and static image menus",
        price: "\u00A339",
        features: [
            "Up to 5 screens",
            "Static image menus",
            "Daypart scheduling",
            "Dashboard access",
            "Screen status monitoring",
        ],
        notIncluded: ["Video playback", "Specials Studio", "Live streams", "Multi-screen sync"],
        cta: "Get Started",
        href: "/contact",
    },
    {
        name: "Onesign Video",
        description: "Daily specials, rotating menus, and video content",
        price: "\u00A359",
        popular: true,
        features: [
            "Everything in Static, plus:",
            "Image + video support",
            "Playlists with transitions",
            "Specials Studio",
            "Design package included",
        ],
        notIncluded: ["4K asset support", "Multi-screen sync", "Live streams"],
        cta: "Get Started",
        href: "/contact",
    },
    {
        name: "Onesign Pro",
        description: "Multi-location businesses with premium needs",
        price: "\u00A389",
        features: [
            "Everything in Video, plus:",
            "Unlimited screens",
            "4K asset support",
            "Live HLS/DASH streams",
            "Multi-screen sync",
            "Managed design support",
            "Priority onboarding",
            "Multi-location dashboards",
        ],
        cta: "Get Started",
        href: "/contact",
    },
    {
        name: "Onesign Enterprise",
        description: "Franchise groups and multi-location chains",
        price: "POA",
        features: [
            "Multi-location management",
            "Centralised brand governance",
            "Live streams with fallback",
            "Unlimited synced screen sets",
            "Bespoke design system",
            "Ongoing design partnership",
            "SLA-backed software support",
            "Dedicated account management",
        ],
        cta: "Contact Sales",
        href: "/contact",
    },
];

const faqs = [
    {
        question: "Do I need to buy hardware?",
        answer: "Any device with a browser works — Smart TVs, Fire Sticks, PCs, Android boxes. We can also supply pre-configured hardware if you prefer a turnkey setup.",
    },
    {
        question: "Can I cancel anytime?",
        answer: "Yes. No contracts, no lock-in. Cancel your subscription at any time and your screens will continue working until the end of your billing period.",
    },
    {
        question: "Who designs the menus?",
        answer: "Every plan includes initial professional design by the Onesign team. You update content; we handle the layouts. Pro and Enterprise plans include ongoing design support.",
    },
    {
        question: "What about multi-location?",
        answer: "Pro and Enterprise plans support unlimited locations with centralised management. Push content to every site from one dashboard, or let individual venues manage their own specials.",
    },
    {
        question: "What does the price cover?",
        answer: "The monthly price is per venue and includes the software platform, scheduling, unlimited content updates, and initial design setup. Hardware is not included but we can advise on the best options for your space.",
    },
    {
        question: "How long does setup take?",
        answer: "Most venues are live within a week. We handle the design, you plug in the player, and the screens start streaming. Priority onboarding on Pro plans means we can move even faster.",
    },
    {
        question: "Can I stream live TV or sports to screens?",
        answer: "Yes. Pro and Enterprise plans include live HLS and DASH streaming. Paste a stream URL, set an optional fallback image, and assign to any screen. Perfect for sports venues, event spaces, and hospitality.",
    },
    {
        question: "How does multi-screen sync work?",
        answer: "Enable sync on a screen set and all screens in that group will show the same slide at the same time. Each screen calculates its position from a shared clock — no cables or hardware needed. Available on Pro and Enterprise plans.",
    },
    {
        question: "What playlist transitions are available?",
        answer: "Onesign Display supports fade, cut, slide left, and slide right transitions with configurable duration. Create reusable playlists that update every screen using them when you make a change.",
    },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion (client island)                                      */
/* ------------------------------------------------------------------ */

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <details className="group border-b border-neutral-200 last:border-0">
            <summary className="flex items-center justify-between cursor-pointer py-6 text-left">
                <span className="font-semibold text-neutral-950 pr-8">
                    {question}
                </span>
                <ChevronDown className="h-5 w-5 text-neutral-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-6 text-sm text-neutral-500 leading-relaxed max-w-3xl">
                {answer}
            </div>
        </details>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
    return (
        <>
            {/* ---- Hero ---- */}
            <MarketingHero
                headline="Simple, Monthly Pricing"
                subhead="Every plan includes scheduling, unlimited content updates, and Onesign design support. No setup fees. No contracts. Cancel anytime."
            />

            {/* ---- Pricing Cards ---- */}
            <SectionWrapper className="!pt-0">
                <PricingCards tiers={tiers} />

                <p className="text-center text-sm text-neutral-400 mt-8">
                    All prices exclude VAT. Prices are per venue per month.
                </p>
            </SectionWrapper>

            {/* ---- Design Included Explainer ---- */}
            <SectionWrapper className="bg-neutral-50">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        What &ldquo;Design Included&rdquo; actually means
                    </h2>
                    <p className="text-neutral-500 text-lg leading-relaxed">
                        Every plan includes professional menu design by the
                        Onesign team. Here is exactly what that covers — and
                        what it does not.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            What it includes
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "Layouts, typography, spacing, and visual hierarchy",
                                "Designer-built templates and systems",
                                "Controlled flexibility for content updates",
                                "Initial onboarding design session",
                                "Brand-matched colour palettes and fonts",
                                "Playlist layouts with professional transitions",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex gap-3 text-sm text-neutral-600"
                                >
                                    <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <X className="h-5 w-5 text-red-400" />
                            What it does NOT mean
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "Unlimited bespoke campaigns on demand",
                                "Blank-canvas design tools for your team",
                                "Replacing your professional designer or agency",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex gap-3 text-sm text-neutral-600"
                                >
                                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-8 text-sm text-neutral-400 italic">
                            &ldquo;Design remains intentional. Onesign Display
                            enforces it.&rdquo;
                        </p>
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- FAQ ---- */}
            <SectionWrapper>
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed">
                            Everything you need to know before getting started.
                        </p>
                    </div>

                    <div className="divide-y divide-neutral-200 border-t border-neutral-200">
                        {faqs.map((faq) => (
                            <FAQItem key={faq.question} {...faq} />
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- Bottom CTA ---- */}
            <SectionWrapper dark>
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to See It in Action?
                    </h2>
                    <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
                        Book a live demo and we will walk you through the
                        platform with your own menus.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-neutral-950 shadow-sm hover:bg-neutral-100 transition-colors"
                        >
                            Book a Demo
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-neutral-400">
                        <a
                            href="mailto:sales@onesignanddigital.com"
                            className="inline-flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                            sales@onesignanddigital.com
                        </a>
                        <a
                            href="tel:01914876767"
                            className="inline-flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                            0191 487 6767
                        </a>
                    </div>
                </div>
            </SectionWrapper>
        </>
    );
}
