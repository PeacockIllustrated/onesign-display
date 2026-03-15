import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export function Footer() {
    return (
        <footer className="bg-neutral-50 border-t border-neutral-100 py-20 px-6">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-1">
                    <Link href="/" className="block mb-6">
                        <Logo width={80} />
                    </Link>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                        Your brand on every screen.<br />
                        Managed by Onesign.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-sm text-neutral-950 mb-4">Product</h4>
                    <ul className="flex flex-col gap-2 text-sm text-neutral-500">
                        <li><Link href="/product" className="hover:text-neutral-950">How it works</Link></li>
                        <li><Link href="/studio" className="hover:text-neutral-950">Specials Studio</Link></li>
                        <li><Link href="/templates" className="hover:text-neutral-950">Templates</Link></li>
                        <li><Link href="/pricing" className="hover:text-neutral-950">Pricing</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-sm text-neutral-950 mb-4">Company</h4>
                    <ul className="flex flex-col gap-2 text-sm text-neutral-500">
                        <li><Link href="/case-studies" className="hover:text-neutral-950">Case Studies</Link></li>
                        <li><Link href="/contact" className="hover:text-neutral-950">Contact</Link></li>
                    </ul>
                </div>

                <div className="text-sm text-neutral-400">
                    &copy; {new Date().getFullYear()} Onesign & Digital.
                </div>
            </div>
        </footer>
    );
}
