import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { LaptopCarousel } from "@/components/marketing/LaptopCarousel";
import { SyncScreens } from "@/components/marketing/SyncScreens";
import { HeroAnimation } from "@/components/marketing/HeroAnimation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Clock,
    Shield,
    MonitorSmartphone,
    Usb,
    AlertTriangle,
    Calendar,
    CalendarOff,
    EyeOff,
    Palette,
    HelpCircle,
    LayoutDashboard,
    Users,
    Activity,
    CalendarClock,
    Globe,
    ListOrdered,
    RefreshCw,
    WifiOff,
    Sunrise,
    Smartphone,
    Phone,
    Mail,
    Radio,
    Volume2,
    ImageOff,
    Layers,
    ToggleLeft,
    PoundSterling,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stream your menus. Schedule your day. — Onesign Display",
    description:
        "The digital menu platform built for busy hospitality teams. Update prices, swap specials, and schedule content in seconds.",
};

/* -------------------------------------------------------------------------- */
/*  Pain points data                                                          */
/* -------------------------------------------------------------------------- */

const painPoints = [
    {
        icon: AlertTriangle,
        text: "USB sticks and manual content swaps every time something changes",
    },
    {
        icon: CalendarOff,
        text: "No way to schedule breakfast, lunch, and dinner menus automatically",
    },
    {
        icon: EyeOff,
        text: "Zero visibility into which screen is showing what, right now",
    },
    {
        icon: Palette,
        text: "Inconsistent branding across locations — every venue looks different",
    },
    {
        icon: HelpCircle,
        text: "Staff who don't know how to operate the screens or update content",
    },
];

/* -------------------------------------------------------------------------- */
/*  Stats data                                                                */
/* -------------------------------------------------------------------------- */

const stats = [
    { icon: Clock, value: "30 seconds", label: "to update any menu" },
    { icon: Shield, value: "24/7", label: "uptime monitoring" },
    { icon: MonitorSmartphone, value: "Multi-screen", label: "sync" },
    { icon: Usb, value: "Zero", label: "USB sticks required" },
];

/* -------------------------------------------------------------------------- */
/*  Component: BrowserFrame — wraps a screenshot in subtle chrome             */
/* -------------------------------------------------------------------------- */

function BrowserFrame({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-xl overflow-hidden border border-neutral-200/60 shadow-2xl bg-neutral-100 ${className}`}
        >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 border-b border-neutral-200/60">
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
                <div className="flex-1 mx-8">
                    <div className="h-5 bg-neutral-200/80 rounded-md max-w-xs mx-auto" />
                </div>
            </div>
            {/* Content */}
            <div className="relative">{children}</div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Component: PhoneFrame — wraps mobile screenshots                          */
/* -------------------------------------------------------------------------- */

function PhoneFrame({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`relative mx-auto w-[280px] md:w-[320px] ${className}`}
        >
            {/* Phone bezel */}
            <div className="rounded-[2.5rem] border-[6px] border-neutral-800 bg-neutral-800 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="relative bg-neutral-800 flex justify-center pt-2 pb-1">
                    <div className="h-5 w-28 bg-neutral-900 rounded-full" />
                </div>
                {/* Screen */}
                <div className="relative rounded-b-[2rem] overflow-hidden bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function MarketingHome() {
    return (
        <>
            {/* ───────────────────────── HERO ───────────────────────── */}
            <MarketingHero
                variant="dark"
                pill="Digital Menu Streaming Platform"
                headline="Digital Menus That Run Themselves"
                subhead="Upload your menus, set your schedule, and walk away. Onesign Display streams the right content to every screen — breakfast, lunch, dinner — automatically."
                primaryCta={{ href: "/contact", label: "Book a Demo" }}
                secondaryCta={{ href: "/product", label: "See How It Works" }}
                above={<HeroAnimation />}
            />

            {/* ──────────────── PAIN / SOLUTION ──────────────── */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
                    {/* Pain column */}
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-red-500/80 mb-4">
                            Sound familiar?
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-10 leading-tight text-neutral-950">
                            Menu boards shouldn&apos;t be this hard.
                        </h2>
                        <ul className="space-y-5">
                            {painPoints.map((point, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                                        <point.icon className="h-4 w-4 text-red-500" />
                                    </div>
                                    <p className="text-neutral-600 leading-relaxed">
                                        {point.text}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Solution column */}
                    <div className="lg:pt-14">
                        <div className="rounded-2xl border border-[#4e7e8c]/20 bg-[#4e7e8c]/5 p-8 md:p-10">
                            <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                                The Onesign way
                            </p>
                            <h3 className="text-2xl md:text-3xl font-bold text-neutral-950 mb-6 leading-tight">
                                Upload. Assign. Schedule. Walk&nbsp;away.
                            </h3>
                            <p className="text-neutral-600 leading-relaxed text-lg mb-6">
                                Upload menus to a central dashboard, assign them
                                to screens, set your schedule — and walk away.
                                Every screen stays on-brand, on-time, and
                                up-to-date without anyone touching a USB stick.
                            </p>
                            <Link
                                href="/product"
                                className="inline-flex items-center text-[#4e7e8c] font-semibold hover:underline"
                            >
                                See how it works
                                <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* ──────────────── FEATURE 1: THE DASHBOARD ──────────────── */}
            <SectionWrapper className="bg-neutral-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text */}
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                            Command Centre
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-neutral-950">
                            The Dashboard
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed mb-8">
                            One screen to see everything. Your clients, venues,
                            screens, and content — organised in a clean
                            hierarchy you can navigate in seconds.
                        </p>
                        <ul className="space-y-4">
                            {[
                                {
                                    icon: LayoutDashboard,
                                    title: "Multi-location hierarchy",
                                    desc: "Clients, venues, and screens — all logically grouped.",
                                },
                                {
                                    icon: Users,
                                    title: "Role-based access",
                                    desc: "Admins manage everything. Clients see only their own screens.",
                                },
                                {
                                    icon: Activity,
                                    title: "Live screen status",
                                    desc: "See which screens are online, last sync time, and what's playing now.",
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="mt-0.5 flex-shrink-0 h-9 w-9 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center">
                                        <item.icon className="h-4.5 w-4.5 text-[#4e7e8c]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-950">
                                            {item.title}
                                        </p>
                                        <p className="text-neutral-500 text-sm">
                                            {item.desc}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Screenshot in laptop */}
                    <div>
                        <LaptopCarousel
                            slides={[
                                { src: '/marketing/screenshot-screen-detail.png', alt: 'Screen management with live preview and content assignment' },
                                { src: '/marketing/screenshot-dashboard.png', alt: 'Admin dashboard showing clients and stores at a glance' },
                            ]}
                            interval={6000}
                        />
                    </div>
                </div>
            </SectionWrapper>

            {/* ──────────────── FEATURE 2: SCHEDULING ──────────────── */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Phone screenshot — left on desktop */}
                    <div className="order-2 lg:order-1 flex justify-center">
                        <PhoneFrame>
                            <Image
                                src="/marketing/screenshot-schedules-mobile.png"
                                alt="Onesign Display mobile schedule editor showing daypart time slots"
                                width={750}
                                height={1624}
                                className="w-full h-auto"
                            />
                        </PhoneFrame>
                    </div>

                    {/* Text — right on desktop */}
                    <div className="order-1 lg:order-2">
                        <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                            Set It &amp; Forget It
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-neutral-950">
                            Schedule Once, Play&nbsp;Forever
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed mb-8">
                            Define your dayparts once — breakfast at 6am, lunch
                            at 11, dinner at 5 — and Onesign switches content
                            automatically. No staff involvement needed.
                        </p>
                        <ul className="space-y-4">
                            {[
                                {
                                    icon: CalendarClock,
                                    title: "Daypart automation",
                                    desc: "Menus swap at exactly the right time, every single day.",
                                },
                                {
                                    icon: Globe,
                                    title: "Timezone-aware",
                                    desc: "Venues in different cities? Each schedule runs in local time.",
                                },
                                {
                                    icon: ListOrdered,
                                    title: "Priority rules",
                                    desc: "Special events override regular schedules, then revert automatically.",
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="mt-0.5 flex-shrink-0 h-9 w-9 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center">
                                        <item.icon className="h-4.5 w-4.5 text-[#4e7e8c]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-950">
                                            {item.title}
                                        </p>
                                        <p className="text-neutral-500 text-sm">
                                            {item.desc}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </SectionWrapper>

            {/* ──────────────── FEATURE 3: PLAYER / ALWAYS ON ──────────────── */}
            <SectionWrapper className="bg-neutral-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text */}
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                            Bulletproof Playback
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-neutral-950">
                            Every Screen. Always&nbsp;On.
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed mb-8">
                            The Onesign player runs in any browser on any
                            device. It auto-refreshes content, recovers from
                            network drops, and stays awake — so your menus never
                            go dark.
                        </p>
                        <ul className="space-y-4">
                            {[
                                {
                                    icon: RefreshCw,
                                    title: "Auto-refresh",
                                    desc: "Content updates sync silently in the background.",
                                },
                                {
                                    icon: WifiOff,
                                    title: "Offline-safe",
                                    desc: "Cached content keeps playing even when the connection drops.",
                                },
                                {
                                    icon: Sunrise,
                                    title: "Always awake",
                                    desc: "Wake lock keeps the screen on 24/7 — no screensavers.",
                                },
                                {
                                    icon: Smartphone,
                                    title: "Any device",
                                    desc: "Smart TVs, tablets, sticks, PCs — if it has a browser, it works.",
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="mt-0.5 flex-shrink-0 h-9 w-9 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center">
                                        <item.icon className="h-4.5 w-4.5 text-[#4e7e8c]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-950">
                                            {item.title}
                                        </p>
                                        <p className="text-neutral-500 text-sm">
                                            {item.desc}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Player screenshot in laptop */}
                    <div>
                        <LaptopCarousel
                            slides={[
                                { src: '/marketing/hero-player-tv.png', alt: 'Onesign Display player running fullscreen — always on, zero maintenance' },
                                { src: '/marketing/hero-neon.jpeg', alt: 'Onesign branded content streaming on a display' },
                            ]}
                            interval={5000}
                        />
                    </div>
                </div>
            </SectionWrapper>

            {/* ──────────────── FEATURE 4: LIVE STREAMS ──────────────── */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text */}
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                            Live Content
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-neutral-950">
                            Stream Live to Any&nbsp;Screen
                        </h2>
                        <p className="text-neutral-500 text-lg leading-relaxed mb-8">
                            Connect an HLS or DASH live feed to any screen. Sports
                            events, live TV, kitchen cameras — stream it all through
                            the same dashboard. If the feed drops, screens
                            automatically switch to a fallback image.
                        </p>
                        <ul className="space-y-4">
                            {[
                                {
                                    icon: Radio,
                                    title: "HLS & DASH support",
                                    desc: "Industry-standard streaming protocols. Paste a URL and you're live.",
                                },
                                {
                                    icon: Volume2,
                                    title: "Audio control",
                                    desc: "Enable or mute audio per stream. Most venues want silent screens.",
                                },
                                {
                                    icon: ImageOff,
                                    title: "Automatic fallback",
                                    desc: "Set a fallback image that shows if the stream goes offline — no black screens.",
                                },
                                {
                                    icon: Calendar,
                                    title: "Scheduled streams",
                                    desc: "Schedule streams to play at specific times — match day at 3pm, back to menus at 6pm.",
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="mt-0.5 flex-shrink-0 h-9 w-9 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center">
                                        <item.icon className="h-4.5 w-4.5 text-[#4e7e8c]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-950">
                                            {item.title}
                                        </p>
                                        <p className="text-neutral-500 text-sm">
                                            {item.desc}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stream visual mockup */}
                    <div>
                        <div className="bg-neutral-900 rounded-2xl p-8 flex flex-col items-center justify-center aspect-video">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">Live</span>
                            </div>
                            <Radio className="h-16 w-16 text-white/20 mb-4" />
                            <p className="text-white font-semibold">Sky Sports Main Event</p>
                            <p className="text-neutral-500 text-sm mt-1">HLS · Audio off · Fallback set</p>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* ──────────────── FEATURE 5: MULTI-SCREEN SYNC ──────────────── */}
            <SectionWrapper className="bg-neutral-50">
                <div className="flex flex-col items-center text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-4">
                        Synchronised Playback
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-neutral-950">
                        Multi-Screen Sync. No Extra&nbsp;Hardware.
                    </h2>
                    <p className="text-neutral-500 text-lg leading-relaxed mb-12 max-w-2xl">
                        Got three menu boards behind the counter? Onesign
                        Display keeps them all in sync — every slide, every
                        transition, at the same time. No HDMI splitters, no
                        mini PCs, no extra hardware. Just your existing screens
                        and WiFi.
                    </p>

                    {/* Synced screens */}
                    <SyncScreens />
                    <p className="text-xs text-[#4e7e8c] font-semibold mt-4 mb-12">Synchronised</p>

                    {/* Feature bullets — 2×2 grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full text-left">
                        {[
                            {
                                icon: Layers,
                                title: "Software-only sync",
                                desc: "Each screen checks a shared clock and calculates which slide to show. No cables between screens.",
                            },
                            {
                                icon: ToggleLeft,
                                title: "One-toggle setup",
                                desc: "Enable sync on a screen set with a single switch. All screens align automatically.",
                            },
                            {
                                icon: MonitorSmartphone,
                                title: "Any device",
                                desc: "Fire Sticks, tablets, PCs, Smart TVs — sync works on any device with a browser.",
                            },
                            {
                                icon: PoundSterling,
                                title: "Save £200–500 per location",
                                desc: "No mini PCs or HDMI splitters needed. Each screen runs independently but stays in lockstep.",
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="mt-0.5 flex-shrink-0 h-9 w-9 rounded-lg bg-[#4e7e8c]/10 flex items-center justify-center">
                                    <item.icon className="h-4.5 w-4.5 text-[#4e7e8c]" />
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-950">
                                        {item.title}
                                    </p>
                                    <p className="text-neutral-500 text-sm">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* ──────────────── STATS BAR ──────────────── */}
            <section
                className="w-full py-16 md:py-20 px-6"
                style={{
                    background:
                        "linear-gradient(135deg, #1a2e35 0%, #2a4a54 50%, #1a2e35 100%)",
                }}
            >
                <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                                    <stat.icon className="h-5 w-5 text-white/80" />
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                                {stat.value}
                            </p>
                            <p className="text-sm text-white/50">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ──────────────── FINAL CTA ──────────────── */}
            <SectionWrapper>
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-neutral-950">
                        Ready to See It in&nbsp;Action?
                    </h2>
                    <p className="text-neutral-500 text-lg mb-10 leading-relaxed">
                        Book a 15-minute demo and we&apos;ll show you how
                        Onesign Display can replace your USB sticks with a
                        system that actually runs itself.
                    </p>

                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-8 py-4 text-base font-medium text-white shadow-sm hover:bg-neutral-800 transition-colors mb-12"
                    >
                        Book a Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-400">
                        <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            0191 487 6767
                        </span>
                        <span className="hidden sm:block text-neutral-200">
                            |
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            sales@onesignanddigital.com
                        </span>
                    </div>
                </div>
            </SectionWrapper>
        </>
    );
}
