import Link from "next/link";
import { SectionWrapper } from "./SectionWrapper";
import { Logo } from "@/components/marketing/Logo";

export function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
            <div className="w-full max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center">
                    <Logo width={90} />
                </Link>

                <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-neutral-600">
                    <Link href="/product" className="hover:text-neutral-950 transition-colors">
                        Product
                    </Link>
                    <Link href="/studio" className="hover:text-neutral-950 transition-colors">
                        Studio
                    </Link>
                    <Link href="/templates" className="hover:text-neutral-950 transition-colors">
                        Templates
                    </Link>
                    <Link href="/pricing" className="hover:text-neutral-950 transition-colors">
                        Pricing
                    </Link>
                </nav>

                <div className="flex gap-4 items-center">
                    <Link
                        href="/app"
                        className="text-sm font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/contact"
                        className="text-sm font-medium bg-neutral-950 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                        Book Demo
                    </Link>
                </div>
            </div>
        </header>
    );
}
