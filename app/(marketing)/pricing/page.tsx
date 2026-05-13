import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { LaunchPricingTiers } from "@/components/marketing/LaunchPricingTiers";
import { ChevronDown, ArrowRight, Calendar, Clock, AlertCircle, ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing — Onesign Display",
    description:
        "Hospitality digital signage and menu boards. Launch pricing from £30/mo for up to 5 screens, ends 31 August 2026.",
    openGraph: {
        title: "Pricing — Onesign Display",
        description:
            "Hospitality digital signage and menu boards. Launch pricing from £30/mo for up to 5 screens, ends 31 August 2026.",
        siteName: "Onesign Display",
    },
};

/* ------------------------------------------------------------------ */
/*  Structured data                                                    */
/* ------------------------------------------------------------------ */

const OFFER_TIERS = [
    {
        name: "Onesign Display — Static",
        description: "HTML menu, up to 5 screens, day-of-week scheduling.",
        price: "30.00",
    },
    {
        name: "Onesign Display — Video",
        description:
            "All menu layouts, Specials Studio, video, 1 HLS stream, up to 5 screens.",
        price: "50.00",
    },
    {
        name: "Onesign Display — Pro",
        description:
            "Custom layouts, brand-kit templates, sync groups, up to 3 HLS streams, multi-site.",
        price: "80.00",
    },
    {
        name: "Onesign Display — Enterprise",
        description:
            "Hardware sourced and installed, dedicated AM, 99.5% SLA, bespoke design refreshes.",
        price: "600.00",
    },
];

function jsonLd() {
    const products = OFFER_TIERS.map((t) => ({
        "@context": "https://schema.org",
        "@type": "Product",
        name: t.name,
        description: t.description,
        brand: { "@type": "Brand", name: "Onesign Display" },
        offers: {
            "@type": "Offer",
            price: t.price,
            priceCurrency: "GBP",
            availability: "https://schema.org/InStock",
            url: "https://display.onesignanddigital.com/pricing",
            priceValidUntil: "2026-08-31",
            validThrough: "2026-08-31",
            priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: t.price,
                priceCurrency: "GBP",
                unitText: "MONTH",
                billingIncrement: 1,
            },
        },
    }));
    return JSON.stringify(products);
}

/* ------------------------------------------------------------------ */
/*  FAQ (verbatim copy)                                                */
/* ------------------------------------------------------------------ */

const FAQS: { question: string; answer: string }[] = [
    {
        question: "What happens to my price after 90 days?",
        answer: "After your 90-day launch period ends, your subscription moves to standard rates at next renewal. We email you 30 days before the change with the new amount. Worked example: Video at launch rate £50/mo moves to £110/mo on renewal.",
    },
    {
        question: "Can I cancel during launch?",
        answer: "Yes. No minimum term. Monthly subscriptions cancel with 30 days notice. Annual prepay subscriptions cancel but aren't refunded for remaining months, which is standard across the industry.",
    },
    {
        question: "Why is annual prepay better during launch?",
        answer: "Annual prepay during launch locks your rate at launch pricing for 12 months from sign-up (longer than the 90-day monthly lock) and includes one month free. A Pro customer pays £880 for 12 months instead of £960 paid monthly, and stays at launch rates the whole way through.",
    },
    {
        question: "What counts as a critical bug?",
        answer: "Anything stopping your screens from displaying the right content, or stopping you from logging in to update it. Specifically: screens showing nothing despite being powered and online, screens showing wrong or stale content, login failures, Specials Studio crashes on publish, or lost content. Cosmetic bugs and feature requests don't count as critical.",
    },
    {
        question: "What happens when I report a critical bug?",
        answer: "Report through the support form, email, or chat. We acknowledge within 4 hours during cover hours (8am to 8pm Mon to Sat UK time) and have a fix or workaround within 48 hours. Sunday and outside-hours response is best-effort. Check the status page before reporting in case it's a known platform-wide issue.",
    },
    {
        question: "Can I upgrade my tier during launch?",
        answer: "Yes, any time. You're billed pro-rata for the rest of the month at your new tier, and your 90-day launch lock continues from your original sign-up date. Upgrading doesn't reset the launch clock.",
    },
    {
        question: "Do I need to buy hardware from Onesign?",
        answer: "Static, Video, and Pro work with any LG webOS smart TV (2018 model year or later). You can use existing screens, source your own, or buy through Onesign at trade price. Enterprise includes hardware sourcing and installation as part of the package.",
    },
    {
        question: "Is there a free trial?",
        answer: "Not during the launch period. Launch pricing is itself the trial: Static at £30/mo is the lowest entry point in UK hospitality signage. Cancel within 30 days if it isn't working out, no penalty.",
    },
    {
        question: "What's in the £250 self-serve setup?",
        answer: "Account creation, screen pairing, one 45-minute remote walkthrough call, template selection, and 30-day priority go-live support. Doesn't include menu design or on-site visits.",
    },
    {
        question: "What's in the £600 white-glove setup?",
        answer: "Everything in self-serve setup plus on-site install visit (UK mainland), initial menu build using your existing artwork, two-hour staff training, content migration from your existing system, and 30-day priority go-live support.",
    },
    {
        question: "What if I want a feature you don't have yet?",
        answer: "Tell us. We're in launch and the roadmap is being shaped by what early customers actually need. Feature requests don't carry an SLA, but they go on a visible roadmap and we'll let you know when we're building.",
    },
];

function FAQItem({
    question,
    answer,
    defaultOpen = false,
}: {
    question: string;
    answer: string;
    defaultOpen?: boolean;
}) {
    return (
        <details
            className="group border-b border-neutral-200 last:border-0"
            open={defaultOpen}
        >
            <summary className="flex items-center justify-between cursor-pointer py-6 text-left list-none">
                <span className="font-semibold text-neutral-950 pr-8">
                    {question}
                </span>
                <ChevronDown className="h-5 w-5 text-neutral-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-6 text-sm text-neutral-600 leading-relaxed max-w-3xl">
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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd() }}
            />

            {/* ---- Page heading ---- */}
            <SectionWrapper className="!pb-10 md:!pb-16">
                <div className="text-center max-w-3xl mx-auto">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                        Pricing
                    </p>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-neutral-950 mb-6">
                        Launch pricing, ends 31 August 2026
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-500 leading-relaxed">
                        Four tiers for hospitality digital signage, with public
                        launch rates while we iron out launch-period bugs
                        alongside our first customers.
                    </p>
                </div>
            </SectionWrapper>

            {/* ---- Launch banner ---- */}
            <SectionWrapper className="!py-0">
                <div className="relative rounded-3xl overflow-hidden border border-[#4e7e8c]/30 bg-gradient-to-br from-[#4e7e8c]/8 via-white to-[#4e7e8c]/5 p-8 md:p-12 shadow-sm">
                    <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4e7e8c]/10 blur-3xl pointer-events-none" />
                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4e7e8c]/10 text-[#4e7e8c] text-xs font-bold uppercase tracking-wider">
                                <Calendar className="h-3.5 w-3.5" />
                                Public launch
                            </span>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold">
                                <Clock className="h-3.5 w-3.5" />
                                Ends 31 August 2026
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-neutral-950 mb-4 leading-tight">
                            Launch pricing, ends 31 August 2026
                        </h2>
                        <p className="text-neutral-700 text-base md:text-lg leading-relaxed max-w-3xl">
                            Onesign Display is in public launch. Until 31 August
                            2026 we&apos;re charging launch rates while we iron
                            out launch-period bugs alongside our first
                            customers. Sign up before 31 August 2026 and lock
                            launch pricing for 90 days from sign-up, or annual
                            prepay to lock launch rates for 12 months. From 1
                            September 2026, list prices step to standard rates
                            for new customers.
                        </p>
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- Tier comparison + toggle ---- */}
            <SectionWrapper>
                <LaunchPricingTiers />
            </SectionWrapper>

            {/* ---- Setup fees ---- */}
            <SectionWrapper className="bg-neutral-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-950">
                            One-off setup fees
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed max-w-2xl mx-auto">
                            Setup covers the labour to get you live. Not
                            discounted during launch — these are real hours and
                            they&apos;re the same on day one of launch as on
                            day 365.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                            <p className="text-3xl font-bold text-neutral-950 mb-1">
                                £250
                            </p>
                            <p className="text-sm font-semibold text-[#4e7e8c] uppercase tracking-wider mb-4">
                                Self-serve setup (Static, Video)
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                Account creation, screen pairing, one 45-minute
                                remote walkthrough call, template selection,
                                and 30-day priority go-live support.
                                Doesn&apos;t include menu design or on-site
                                visits.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                            <p className="text-3xl font-bold text-neutral-950 mb-1">
                                £600
                            </p>
                            <p className="text-sm font-semibold text-[#4e7e8c] uppercase tracking-wider mb-4">
                                White-glove setup (Pro, Enterprise)
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                Everything in self-serve setup plus on-site
                                install visit (UK mainland), initial menu build
                                using your existing artwork, two-hour staff
                                training, content migration from your existing
                                system, and 30-day priority go-live support.
                                Travel outside the North East may be quoted
                                separately for unusually remote sites.
                            </p>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- SLA & support ---- */}
            <SectionWrapper>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                            Support commitment
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-950">
                            What we commit to during launch period
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed max-w-2xl mx-auto">
                            Launch pricing reflects the fact that real-world
                            deployment will surface edge cases. To make that
                            fair, we commit to the following until 31 August
                            2026:
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <li className="bg-white p-6 rounded-2xl border border-neutral-200">
                            <div className="h-10 w-10 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center mb-4">
                                <AlertCircle className="h-5 w-5 text-[#4e7e8c]" />
                            </div>
                            <p className="font-bold text-neutral-950 mb-2">
                                Critical bug response
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                Acknowledged within 4 hours, fix or workaround
                                within 48 hours.
                            </p>
                        </li>
                        <li className="bg-white p-6 rounded-2xl border border-neutral-200">
                            <div className="h-10 w-10 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center mb-4">
                                <Clock className="h-5 w-5 text-[#4e7e8c]" />
                            </div>
                            <p className="font-bold text-neutral-950 mb-2">
                                Cover hours
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                Monday to Saturday, 8am to 8pm UK time. Sunday
                                and outside-hours: best effort.
                            </p>
                        </li>
                        <li className="bg-white p-6 rounded-2xl border border-neutral-200">
                            <div className="h-10 w-10 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center mb-4">
                                <ShieldCheck className="h-5 w-5 text-[#4e7e8c]" />
                            </div>
                            <p className="font-bold text-neutral-950 mb-2">
                                Public status page
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                <a
                                    href="https://status.onesigndisplay.com"
                                    className="text-[#4e7e8c] hover:underline inline-flex items-center gap-1"
                                    rel="noopener"
                                >
                                    status.onesigndisplay.com
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                                {" — check here first before reporting."}
                            </p>
                        </li>
                    </ul>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                            <h3 className="font-bold text-neutral-950 mb-3">
                                What counts as a critical bug
                            </h3>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                Screens showing nothing despite being powered
                                and online; screens showing wrong or stale
                                content; login failures; Specials Studio
                                crashes on publish; lost content; manifest API
                                errors causing health-check failures across
                                your fleet.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                            <h3 className="font-bold text-neutral-950 mb-3">
                                What doesn&apos;t count as a critical bug
                            </h3>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                Cosmetic UI issues; performance slowness that
                                isn&apos;t failure; single-asset rendering
                                quirks; feature gaps; third-party outages;
                                customer-side issues (internet, hardware
                                physical damage, content uploaded outside
                                spec).
                            </p>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- FAQ ---- */}
            <SectionWrapper className="bg-neutral-50">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-950">
                            Frequently asked questions
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed">
                            Everything you need to know about launch pricing,
                            cancellation, support, and what comes after.
                        </p>
                    </div>

                    <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200 bg-white px-6 md:px-8 rounded-2xl">
                        {FAQS.map((faq, i) => (
                            <FAQItem
                                key={faq.question}
                                question={faq.question}
                                answer={faq.answer}
                                defaultOpen={i === 0}
                            />
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* ---- Closing CTA ---- */}
            <SectionWrapper dark>
                <div className="text-center max-w-2xl mx-auto">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                        Last chance for launch pricing
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                        Launch ends 31 August 2026.
                    </h2>
                    <p className="text-neutral-300 text-lg mb-10 leading-relaxed">
                        Sign up before then to lock launch pricing for 90 days,
                        or annual prepay for 12 months at launch rates.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-neutral-950 shadow-sm hover:bg-neutral-100 transition-colors"
                        >
                            Start launch trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                            Book a call
                        </Link>
                    </div>
                </div>
            </SectionWrapper>
        </>
    );
}
