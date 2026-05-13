"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type BillingCycle = "monthly" | "annual";

type TierKey = "static" | "video" | "pro" | "enterprise";

interface Tier {
    key: TierKey;
    name: string;
    popular?: boolean;
    launchMonthly: string;
    standardMonthly: string;
    launchAnnual: string;
    standardAnnual: string;
    unit: string;
    standardFromDate: string;
    cta: { label: string; href: string };
}

const TIERS: Tier[] = [
    {
        key: "static",
        name: "Static",
        launchMonthly: "£30",
        standardMonthly: "£60",
        launchAnnual: "£330",
        standardAnnual: "£660",
        unit: "/mo",
        standardFromDate: "From 1 Sep 2026",
        cta: { label: "Start launch trial", href: "/auth/signup" },
    },
    {
        key: "video",
        name: "Video",
        popular: true,
        launchMonthly: "£50",
        standardMonthly: "£110",
        launchAnnual: "£550",
        standardAnnual: "£1,210",
        unit: "/mo",
        standardFromDate: "From 1 Sep 2026",
        cta: { label: "Start launch trial", href: "/auth/signup" },
    },
    {
        key: "pro",
        name: "Pro",
        launchMonthly: "£80",
        standardMonthly: "£195",
        launchAnnual: "£880",
        standardAnnual: "£2,145",
        unit: "/mo",
        standardFromDate: "From 1 Sep 2026",
        cta: { label: "Start launch trial", href: "/auth/signup" },
    },
    {
        key: "enterprise",
        name: "Enterprise",
        launchMonthly: "From £600",
        standardMonthly: "From £600",
        launchAnnual: "Quoted",
        standardAnnual: "Quoted",
        unit: "/mo",
        standardFromDate: "Bespoke pricing",
        cta: { label: "Book a call", href: "/contact" },
    },
];

interface FeatureRow {
    label: string;
    values: Record<TierKey, string>;
}

const FEATURES: FeatureRow[] = [
    {
        label: "Screens included",
        values: {
            static: "Up to 5",
            video: "Up to 5",
            pro: "Up to 5",
            enterprise: "5, hardware included",
        },
    },
    {
        label: "Extra screens",
        values: {
            static: "+£6/screen/mo",
            video: "+£10/screen/mo",
            pro: "+£16/screen/mo",
            enterprise: "Quoted",
        },
    },
    {
        label: "Setup fee (one-off)",
        values: {
            static: "£250",
            video: "£250",
            pro: "£600",
            enterprise: "£600",
        },
    },
    {
        label: "Menu layouts",
        values: {
            static: "HTML menu only",
            video: "All 3 (Quadrant, Panuozzi, HTML)",
            pro: "All 3 + custom layouts on request",
            enterprise: "Bespoke templates designed",
        },
    },
    {
        label: "Specials Studio",
        values: {
            static: "Not included",
            video: "Full editor, layers, properties, 30+ stock templates",
            pro: "Full + custom font library + brand-kit templates",
            enterprise: "Full + bespoke template pack designed for the brand",
        },
    },
    {
        label: "Video content",
        values: {
            static: "No",
            video: "Yes",
            pro: "Yes",
            enterprise: "Yes",
        },
    },
    {
        label: "HLS live streams",
        values: {
            static: "No",
            video: "1 stream",
            pro: "Up to 3 streams",
            enterprise: "Unlimited",
        },
    },
    {
        label: "Playlists",
        values: {
            static: "1",
            video: "Unlimited",
            pro: "Unlimited",
            enterprise: "Unlimited",
        },
    },
    {
        label: "Scheduling",
        values: {
            static: "Day-of-week swaps",
            video: "Full dayparting",
            pro: "Full dayparting + schedule templates",
            enterprise: "Multi-site schedule orchestration",
        },
    },
    {
        label: "Sync groups / screen sets",
        values: {
            static: "No",
            video: "No",
            pro: "Yes",
            enterprise: "Yes",
        },
    },
    {
        label: "Stores per account",
        values: {
            static: "1",
            video: "1",
            pro: "Up to 5",
            enterprise: "Unlimited",
        },
    },
    {
        label: "Users per account",
        values: {
            static: "1",
            video: "3",
            pro: "Unlimited (role-based)",
            enterprise: "Unlimited",
        },
    },
    {
        label: "Support",
        values: {
            static: "Email, 48h",
            video: "Email + chat, 24h",
            pro: "Priority chat + phone, 8h",
            enterprise: "Dedicated AM, SLA",
        },
    },
    {
        label: "Hardware",
        values: {
            static: "Customer-supplied",
            video: "Customer-supplied",
            pro: "Customer-supplied",
            enterprise: "Sourced, installed, maintained by Onesign",
        },
    },
    {
        label: "Install / commissioning",
        values: {
            static: "Self-serve pairing",
            video: "Self-serve pairing",
            pro: "Optional paid install",
            enterprise: "White-glove install per location, included",
        },
    },
    {
        label: "Uptime SLA",
        values: {
            static: "None (best effort)",
            video: "None (best effort)",
            pro: "None (best effort)",
            enterprise: "99.5% with credits",
        },
    },
    {
        label: "Bespoke design work",
        values: {
            static: "No",
            video: "No",
            pro: "No",
            enterprise: "Quarterly menu/specials refresh included",
        },
    },
];

/* Mobile card order: Video, Static, Pro, Enterprise */
const MOBILE_ORDER: TierKey[] = ["video", "static", "pro", "enterprise"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function priceFor(tier: Tier, cycle: BillingCycle, variant: "launch" | "standard") {
    if (cycle === "monthly") {
        return variant === "launch" ? tier.launchMonthly : tier.standardMonthly;
    }
    return variant === "launch" ? tier.launchAnnual : tier.standardAnnual;
}

function unitFor(tier: Tier, cycle: BillingCycle) {
    if (tier.key === "enterprise") return "";
    return cycle === "monthly" ? "/mo" : "/yr";
}

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */

function BillingToggle({
    cycle,
    onChange,
}: {
    cycle: BillingCycle;
    onChange: (c: BillingCycle) => void;
}) {
    return (
        <div
            role="tablist"
            aria-label="Billing cycle"
            className="inline-flex p-1 bg-neutral-100 rounded-full border border-neutral-200"
        >
            <button
                role="tab"
                aria-selected={cycle === "monthly"}
                onClick={() => onChange("monthly")}
                className={clsx(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-colors",
                    cycle === "monthly"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-950"
                )}
            >
                Monthly
            </button>
            <button
                role="tab"
                aria-selected={cycle === "annual"}
                onClick={() => onChange("annual")}
                className={clsx(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-2",
                    cycle === "annual"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-950"
                )}
            >
                Annual
                <span
                    className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                        cycle === "annual"
                            ? "bg-[#4e7e8c]/10 text-[#4e7e8c]"
                            : "bg-neutral-200 text-neutral-500"
                    )}
                >
                    One month free
                </span>
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tier card (used in mobile stacked view)                            */
/* ------------------------------------------------------------------ */

function TierCard({ tier, cycle }: { tier: Tier; cycle: BillingCycle }) {
    const launch = priceFor(tier, cycle, "launch");
    const standard = priceFor(tier, cycle, "standard");
    const unit = unitFor(tier, cycle);
    const isEnterprise = tier.key === "enterprise";

    return (
        <div
            className={clsx(
                "relative flex flex-col p-6 rounded-2xl border",
                tier.popular
                    ? "border-[#4e7e8c] bg-white shadow-xl ring-1 ring-[#4e7e8c]/30"
                    : "border-neutral-200 bg-white"
            )}
        >
            {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-[#4e7e8c] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                        Most popular
                    </span>
                </div>
            )}

            <h3 className="text-lg font-bold text-neutral-950 mb-1">
                {tier.name}
            </h3>

            <div className="mt-2 mb-4">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-neutral-950">
                        {launch}
                    </span>
                    {unit && (
                        <span className="text-sm text-neutral-500">{unit}</span>
                    )}
                </div>
                {!isEnterprise ? (
                    <p className="mt-1.5 text-xs text-neutral-400">
                        <span className="line-through">{standard}{unit}</span>
                        {" "}
                        <span>· {tier.standardFromDate}</span>
                    </p>
                ) : (
                    <p className="mt-1.5 text-xs text-neutral-400">
                        {tier.standardFromDate}
                    </p>
                )}
            </div>

            <Link
                href={tier.cta.href}
                className={clsx(
                    "w-full text-center py-3 rounded-lg text-sm font-semibold transition-colors mb-6",
                    tier.popular
                        ? "bg-[#4e7e8c] text-white hover:bg-[#3d6a77]"
                        : isEnterprise
                            ? "bg-white text-neutral-950 border border-neutral-300 hover:bg-neutral-50"
                            : "bg-neutral-950 text-white hover:bg-neutral-800"
                )}
            >
                {tier.cta.label}
            </Link>

            <ul className="space-y-3 text-sm">
                {FEATURES.map((row) => (
                    <li
                        key={row.label}
                        className="flex flex-col gap-0.5 pb-3 border-b border-neutral-100 last:border-0 last:pb-0"
                    >
                        <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                            {row.label}
                        </span>
                        <span className="text-neutral-700">
                            {row.values[tier.key]}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Desktop comparison header (used inside sticky header)              */
/* ------------------------------------------------------------------ */

function DesktopTierHeader({
    tier,
    cycle,
}: {
    tier: Tier;
    cycle: BillingCycle;
}) {
    const launch = priceFor(tier, cycle, "launch");
    const standard = priceFor(tier, cycle, "standard");
    const unit = unitFor(tier, cycle);
    const isEnterprise = tier.key === "enterprise";

    return (
        <div
            className={clsx(
                "relative flex flex-col p-5 h-full",
                tier.popular ? "bg-[#4e7e8c]/5" : "bg-white"
            )}
        >
            {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-[#4e7e8c] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                        Most popular
                    </span>
                </div>
            )}

            <h3
                className={clsx(
                    "text-base font-bold mb-2",
                    tier.popular ? "text-[#4e7e8c]" : "text-neutral-950"
                )}
            >
                {tier.name}
            </h3>

            <div className="mb-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-neutral-950">
                        {launch}
                    </span>
                    {unit && (
                        <span className="text-xs text-neutral-500">{unit}</span>
                    )}
                </div>
                {!isEnterprise ? (
                    <p className="mt-1 text-[11px] text-neutral-400 leading-tight">
                        <span className="line-through">
                            {standard}{unit}
                        </span>
                        <br />
                        {tier.standardFromDate}
                    </p>
                ) : (
                    <p className="mt-1 text-[11px] text-neutral-400 leading-tight">
                        {tier.standardFromDate}
                    </p>
                )}
            </div>

            <Link
                href={tier.cta.href}
                className={clsx(
                    "block w-full text-center py-2 rounded-lg text-xs font-semibold transition-colors mt-auto",
                    tier.popular
                        ? "bg-[#4e7e8c] text-white hover:bg-[#3d6a77]"
                        : isEnterprise
                            ? "bg-white text-neutral-950 border border-neutral-300 hover:bg-neutral-50"
                            : "bg-neutral-950 text-white hover:bg-neutral-800"
                )}
            >
                {tier.cta.label}
            </Link>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LaunchPricingTiers() {
    const [cycle, setCycle] = useState<BillingCycle>("monthly");

    const mobileTiers = MOBILE_ORDER.map(
        (key) => TIERS.find((t) => t.key === key)!
    );

    return (
        <div>
            {/* Toggle */}
            <div className="flex justify-center mb-10">
                <BillingToggle cycle={cycle} onChange={setCycle} />
            </div>

            {/* ----- Desktop: feature comparison table ----- */}
            <div className="hidden lg:block">
                <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
                    <div className="grid grid-cols-[minmax(220px,1.4fr)_repeat(4,1fr)] sticky top-16 z-20 bg-white border-b border-neutral-200">
                        <div className="p-5 bg-neutral-50 border-r border-neutral-200" />
                        {TIERS.map((tier, i) => (
                            <div
                                key={tier.key}
                                className={clsx(
                                    "relative",
                                    i < TIERS.length - 1 &&
                                        "border-r border-neutral-200"
                                )}
                            >
                                <DesktopTierHeader tier={tier} cycle={cycle} />
                            </div>
                        ))}
                    </div>

                    {FEATURES.map((row, i) => (
                        <div
                            key={row.label}
                            className={clsx(
                                "grid grid-cols-[minmax(220px,1.4fr)_repeat(4,1fr)] text-sm",
                                i % 2 === 1 && "bg-neutral-50/60"
                            )}
                        >
                            <div className="p-4 font-semibold text-neutral-900 border-r border-neutral-200 flex items-center">
                                {row.label}
                            </div>
                            {TIERS.map((tier, ti) => (
                                <div
                                    key={tier.key}
                                    className={clsx(
                                        "p-4 flex items-center text-neutral-700",
                                        ti < TIERS.length - 1 &&
                                            "border-r border-neutral-200",
                                        tier.popular && "bg-[#4e7e8c]/5"
                                    )}
                                >
                                    {row.values[tier.key]}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ----- Mobile + tablet: stacked tier cards ----- */}
            <div className="lg:hidden flex flex-col gap-8 max-w-md mx-auto">
                {mobileTiers.map((tier) => (
                    <TierCard key={tier.key} tier={tier} cycle={cycle} />
                ))}
            </div>

            <p className="text-center text-sm text-neutral-400 mt-10">
                All prices exclude VAT.
            </p>
        </div>
    );
}
