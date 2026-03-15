import { Check, X } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface PricingTier {
    name: string;
    description: string;
    price: string;
    features: string[];
    notIncluded?: string[];
    cta: string;
    href: string;
    popular?: boolean;
}

export function PricingCards({ tiers }: { tiers: PricingTier[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {tiers.map((tier) => (
                <div
                    key={tier.name}
                    className={clsx(
                        "relative flex flex-col p-6 rounded-2xl border transition-all duration-300",
                        tier.popular
                            ? "border-neutral-950 shadow-xl bg-neutral-950 text-white"
                            : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300"
                    )}
                >
                    {tier.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max">
                            <span className="bg-white text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-200 shadow-sm uppercase tracking-wider">
                                Most Popular
                            </span>
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className={clsx("text-base font-bold mb-1", tier.popular ? "text-white" : "text-neutral-950")}>
                            {tier.name}
                        </h3>
                        <p className={clsx("text-xs leading-relaxed min-h-[40px]", tier.popular ? "text-neutral-400" : "text-neutral-500")}>
                            {tier.description}
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-baseline">
                            <span className="text-3xl font-bold">{tier.price}</span>
                            {tier.price !== "POA" && (
                                <span className={clsx("text-xs ml-1", tier.popular ? "text-neutral-400" : "text-neutral-500")}>/ venue</span>
                            )}
                        </div>
                        {/* Hacky way to inject the secondary price line if present in the price string or passed separately. 
                             Actually, looking at the request, the price line has complex text like "(or £29 + £120 one-off)".
                             I should probably just let 'price' range be string and handle formatting. */ }
                    </div>

                    <ul className="flex-1 space-y-3 mb-8">
                        {tier.features.map((feature) => (
                            <li key={feature} className="flex items-start text-xs">
                                <Check className={clsx("h-4 w-4 mr-2 shrink-0", tier.popular ? "text-white" : "text-neutral-950")} />
                                <span className={clsx(tier.popular ? "text-neutral-300" : "text-neutral-600")}>{feature}</span>
                            </li>
                        ))}
                        {tier.notIncluded?.map((feature) => (
                            <li key={feature} className="flex items-start text-xs opacity-50">
                                <X className={clsx("h-4 w-4 mr-2 shrink-0", tier.popular ? "text-neutral-600" : "text-neutral-400")} />
                                <span className={clsx(tier.popular ? "text-neutral-500" : "text-neutral-400")}>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href={tier.href}
                        className={clsx(
                            "w-full text-center py-3 rounded-lg text-sm font-semibold transition-colors",
                            tier.popular
                                ? "bg-white text-neutral-950 hover:bg-neutral-100"
                                : "bg-neutral-950 text-white hover:bg-neutral-800"
                        )}
                    >
                        {tier.cta}
                    </Link>
                </div>
            ))}
        </div>
    );
}
