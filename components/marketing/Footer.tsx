import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

const productLinks = [
    { label: "How it works", href: "/product" },
    { label: "Specials Studio", href: "/studio" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" },
];

const companyLinks = [
    { label: "Contact", href: "/contact" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Sign in", href: "/app" },
];

export function Footer() {
    return (
        <footer className="bg-neutral-950 text-white">
            <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-8">
                {/* Main 4-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-neutral-800">
                    {/* Column 1 — Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-block mb-5">
                            <Image
                                src="/assets/OD-Logo-Light.svg"
                                alt="Onesign Display"
                                width={130}
                                height={44}
                                className="object-contain"
                            />
                        </Link>
                        <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                            Your brand on every screen.
                            <br />
                            Managed by Onesign.
                        </p>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            D86, Princesway North
                            <br />
                            Gateshead, NE11 0TU
                        </p>
                    </div>

                    {/* Column 2 — Product */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
                        <ul className="flex flex-col gap-2.5">
                            {productLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3 — Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
                        <ul className="flex flex-col gap-2.5">
                            {companyLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4 — Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Get in Touch</h4>
                        <ul className="flex flex-col gap-3">
                            <li>
                                <a
                                    href="mailto:sales@onesignanddigital.com"
                                    className="flex items-start gap-2.5 text-sm text-neutral-400 hover:text-white transition-colors"
                                >
                                    <Mail size={16} className="mt-0.5 shrink-0" />
                                    sales@onesignanddigital.com
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:01914876767"
                                    className="flex items-center gap-2.5 text-sm text-neutral-400 hover:text-white transition-colors"
                                >
                                    <Phone size={16} className="shrink-0" />
                                    0191 487 6767
                                </a>
                            </li>
                            <li>
                                <span className="flex items-start gap-2.5 text-sm text-neutral-400">
                                    <MapPin size={16} className="mt-0.5 shrink-0" />
                                    <span>
                                        D86, Princesway North
                                        <br />
                                        Gateshead, NE11 0TU
                                    </span>
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 text-xs text-neutral-500">
                    <span>&copy; 2026 Onesign &amp; Digital</span>
                    <span>Digital menu streaming platform</span>
                </div>
            </div>
        </footer>
    );
}
