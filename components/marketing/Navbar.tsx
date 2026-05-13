"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/marketing/Logo";

const navLinks = [
    { label: "Product", href: "/product" },
    { label: "Studio", href: "/studio" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
];

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-sm">
            <div className="w-full max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Logo width={90} />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-neutral-700">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="hover:text-neutral-950 transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTAs */}
                <div className="hidden md:flex gap-4 items-center">
                    <Link
                        href="/app"
                        className="text-sm font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/contact"
                        className="text-sm font-medium bg-[#4e7e8c] text-white px-4 py-2 rounded-lg hover:bg-[#3d6a77] transition-colors"
                    >
                        Book a Demo
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    className="md:hidden p-2 -mr-2 text-neutral-800 hover:text-neutral-950 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

        </header>

        {/* Mobile overlay — rendered OUTSIDE the header because the header's
            backdrop-filter creates a containing block that would otherwise
            clip this fixed-positioned panel to the header's 64px height. */}
        {mobileOpen && (
            <div className="fixed inset-0 top-16 z-40 bg-white md:hidden overflow-y-auto">
                <nav className="flex flex-col px-6 pt-8 pb-12 gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="text-lg font-medium text-neutral-800 hover:text-neutral-950 py-3 border-b border-neutral-100 transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="flex flex-col gap-3 pt-6">
                        <Link
                            href="/app"
                            onClick={() => setMobileOpen(false)}
                            className="text-center text-sm font-medium text-neutral-700 hover:text-neutral-950 py-3 border border-neutral-200 rounded-lg transition-colors"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/contact"
                            onClick={() => setMobileOpen(false)}
                            className="text-center text-sm font-medium bg-[#4e7e8c] text-white py-3 rounded-lg hover:bg-[#3d6a77] transition-colors"
                        >
                            Book a Demo
                        </Link>
                    </div>
                </nav>
            </div>
        )}
        </>
    );
}
