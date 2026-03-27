import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { LaptopCarousel } from "@/components/marketing/LaptopCarousel";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Check,
    Building2,
    ShieldCheck,
    Activity,
    MousePointerClick,
    Upload,
    FileImage,
    Film,
    FolderSearch,
    Clock,
    Globe,
    Layers,
    CalendarDays,
    Timer,
    Palette,
    PenTool,
    Eye,
    Send,
    Wifi,
    WifiOff,
    MonitorSmartphone,
    Zap,
    GripVertical,
    Sparkles,
    RefreshCw,
    Link2,
    MonitorPlay,
    ToggleLeft,
    Smartphone,
    Store,
    Radio,
    Volume2,
    ImageOff,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "How Onesign Display works",
    description:
        "From kitchen to screen in four simple steps. Menu boards that run themselves.",
};

/* ------------------------------------------------------------------ */
/*  Reusable sub-components (page-local)                              */
/* ------------------------------------------------------------------ */

function SectionNumber({ n }: { n: string }) {
    return (
        <span className="block font-bold text-[5rem] md:text-[7rem] leading-none text-[#4e7e8c]/10 select-none mb-4 tracking-tight">
            {n}
        </span>
    );
}

function FeatureItem({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
}) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4e7e8c]/10 text-[#4e7e8c]">
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-neutral-600 leading-relaxed">{text}</span>
        </li>
    );
}

function DesktopScreenshot({
    src,
    alt,
    priority = false,
    extraSlides,
}: {
    src: string;
    alt: string;
    priority?: boolean;
    extraSlides?: { src: string; alt: string }[];
}) {
    const slides = [{ src, alt }, ...(extraSlides || [])];
    return (
        <LaptopCarousel
            slides={slides}
            interval={5000}
        />
    );
}

function PhoneScreenshot({ src, alt }: { src: string; alt: string }) {
    return (
        <div className="mx-auto w-[260px] md:w-[280px]">
            <div className="relative rounded-[2.5rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-28 h-6 bg-neutral-900 rounded-b-2xl" />
                <div className="relative rounded-[2rem] overflow-hidden">
                    <Image
                        src={src}
                        alt={alt}
                        width={750}
                        height={1624}
                        className="w-full h-auto"
                    />
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ProductPage() {
    return (
        <>
            {/* ====================================================== */}
            {/*  HERO                                                   */}
            {/* ====================================================== */}
            <MarketingHero
                pill="Product Walkthrough"
                headline="How Onesign Display Works"
                subhead="From kitchen to screen in four simple steps. Menu boards that run themselves."
                primaryCta={{ href: "/contact", label: "Book a Demo" }}
                secondaryCta={{ href: "/pricing", label: "View Pricing" }}
            >
                <Image
                    src="/marketing/hero-player-tv.png"
                    alt="Onesign Display player running fullscreen on a TV"
                    width={2752}
                    height={1536}
                    className="w-full h-full object-cover"
                    priority
                />
            </MarketingHero>

            {/* ====================================================== */}
            {/*  02 — THE DASHBOARD                                     */}
            {/* ====================================================== */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text — left */}
                    <div>
                        <SectionNumber n="02" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            The Dashboard
                        </h2>
                        <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                            Your team gets a single control centre for every
                            screen across every location. See what&rsquo;s
                            playing, who changed it, and when it last synced
                            &mdash; all in one glance.
                        </p>
                        <ul className="space-y-4">
                            <FeatureItem
                                icon={Building2}
                                text="Multi-location hierarchy — group screens by venue, region, or brand"
                            />
                            <FeatureItem
                                icon={ShieldCheck}
                                text="Role-based access — owners, managers, and staff each see what they need"
                            />
                            <FeatureItem
                                icon={Activity}
                                text="Screen status monitoring — online, offline, last-sync timestamps at a glance"
                            />
                            <FeatureItem
                                icon={MousePointerClick}
                                text="One-click media assignment — drag content straight onto a screen"
                            />
                        </ul>
                    </div>

                    {/* Image — right */}
                    <DesktopScreenshot
                        src="/marketing/screenshot-dashboard.png"
                        alt="Onesign Display admin dashboard showing clients overview"
                        priority
                    />
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  03 — UPLOAD. ASSIGN. DONE.                             */}
            {/* ====================================================== */}
            <SectionWrapper className="bg-neutral-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image — left (carousel with both screenshots) */}
                    <div className="order-2 lg:order-1">
                        <DesktopScreenshot
                            src="/marketing/screenshot-media-library.png"
                            alt="Media library with uploads and filters"
                            extraSlides={[
                                { src: '/marketing/screenshot-screen-detail.png', alt: 'Screen management with live preview' },
                            ]}
                        />
                    </div>

                    {/* Text — right */}
                    <div className="order-1 lg:order-2">
                        <SectionNumber n="03" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            Upload. Assign. Done.
                        </h2>
                        <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                            Upload menus as images or videos. Drag and drop into
                            your media library, then assign directly to screens.
                            No USB sticks, no IT tickets.
                        </p>
                        <ul className="space-y-4">
                            <FeatureItem
                                icon={Upload}
                                text="Batch upload — drag entire folders of menu assets at once"
                            />
                            <FeatureItem
                                icon={FolderSearch}
                                text="Smart filename matching — auto-tag content by venue or daypart"
                            />
                            <FeatureItem
                                icon={FileImage}
                                text="Full format support — PNG, JPG, and WebP images"
                            />
                            <FeatureItem
                                icon={Film}
                                text="Video support — MP4 and WebM for animated menus and promos"
                            />
                        </ul>
                    </div>
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  04 — SCHEDULE ONCE, PLAY FOREVER                       */}
            {/* ====================================================== */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text — left */}
                    <div>
                        <SectionNumber n="04" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            Schedule Once, Play&nbsp;Forever
                        </h2>
                        <p className="text-lg text-neutral-500 mb-4 leading-relaxed">
                            Breakfast at 6 am, lunch at 11:30, evening specials
                            from 5 pm. Set it once and the right menu appears on
                            the right screen at the right time &mdash; every
                            day, automatically.
                        </p>
                        <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                            Day-of-week scheduling, optional date ranges, and
                            30-second precision give you total control without
                            the daily busywork.
                        </p>
                        <ul className="space-y-4">
                            <FeatureItem
                                icon={Clock}
                                text="Daypart automation — menus switch on the dot, every day"
                            />
                            <FeatureItem
                                icon={Globe}
                                text="Multi-timezone — perfect for chains spanning time zones"
                            />
                            <FeatureItem
                                icon={Layers}
                                text="Priority rules — layer schedules so overrides always win"
                            />
                            <FeatureItem
                                icon={CalendarDays}
                                text="Day-of-week & date ranges — weekend brunch, bank holidays, seasonal menus"
                            />
                            <FeatureItem
                                icon={Timer}
                                text="30-second precision — change content mid-service if you need to"
                            />
                        </ul>
                    </div>

                    {/* Phone image — right */}
                    <div className="flex justify-center">
                        <PhoneScreenshot
                            src="/marketing/screenshot-schedules-mobile.png"
                            alt="Mobile schedule editor for Onesign Display"
                        />
                    </div>
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  05 — SPECIALS STUDIO                                   */}
            {/* ====================================================== */}
            <SectionWrapper className="bg-neutral-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image — left */}
                    <div className="order-2 lg:order-1">
                        <DesktopScreenshot
                            src="/marketing/screenshot-specials-studio.png"
                            alt="Specials Studio template picker"
                        />
                    </div>

                    {/* Text — right */}
                    <div className="order-1 lg:order-2">
                        <SectionNumber n="05" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            Specials Studio
                        </h2>
                        <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                            Your team creates today&rsquo;s specials in four
                            steps: pick a template, fill in the details, preview
                            live, and publish. No design skills required &mdash;
                            30 seconds from kitchen to screen.
                        </p>

                        {/* Step flow */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {[
                                {
                                    icon: Palette,
                                    label: "Pick a Template",
                                },
                                {
                                    icon: PenTool,
                                    label: "Fill in Details",
                                },
                                {
                                    icon: Eye,
                                    label: "Preview Live",
                                },
                                {
                                    icon: Send,
                                    label: "Publish",
                                },
                            ].map((step, i) => (
                                <div
                                    key={step.label}
                                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4e7e8c]/10 text-[#4e7e8c] text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm font-medium text-neutral-700">
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <ul className="space-y-4">
                            <FeatureItem
                                icon={Sparkles}
                                text="Beautiful templates — designed by Onesign, on-brand every time"
                            />
                            <FeatureItem
                                icon={Check}
                                text="No design tools — simple forms that anyone on your team can use"
                            />
                        </ul>
                    </div>
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  06 — THE PLAYER                                        */}
            {/* ====================================================== */}
            <SectionWrapper dark>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text — left */}
                    <div>
                        <SectionNumber n="06" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            The Player
                        </h2>
                        <p className="text-lg text-neutral-400 mb-4 leading-relaxed">
                            A fullscreen, always-on web app that turns any
                            screen into a digital menu board. TVs, PCs, Fire
                            Sticks &mdash; if it has a browser, it can run
                            Onesign.
                        </p>
                        <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
                            Pair a screen with a token, and content starts
                            streaming immediately. No apps to install, no
                            software to maintain.
                        </p>
                        <ul className="space-y-4">
                            <FeatureItem
                                icon={RefreshCw}
                                text="Auto-refresh — new content appears within 30 seconds"
                            />
                            <FeatureItem
                                icon={WifiOff}
                                text="Offline safe — last-known content keeps playing if Wi-Fi drops"
                            />
                            <FeatureItem
                                icon={Zap}
                                text="Always awake — prevents screen sleep and power-saving interruptions"
                            />
                            <FeatureItem
                                icon={MonitorSmartphone}
                                text="Any device — TV, tablet, Fire Stick, or spare laptop"
                            />
                        </ul>
                    </div>

                    {/* Image — right (player in laptop) */}
                    <div>
                        <LaptopCarousel
                            slides={[
                                { src: '/marketing/hero-player-tv.png', alt: 'Onesign player running fullscreen — always on, zero maintenance' },
                                { src: '/marketing/hero-neon.jpeg', alt: 'Onesign branded content on a live display' },
                                { src: '/marketing/hero-gold.png', alt: 'Premium Onesign display content' },
                            ]}
                            interval={4000}
                        />
                    </div>
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  07 — PLAYLISTS & SLIDESHOWS                            */}
            {/* ====================================================== */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Phone image — left */}
                    <div className="flex justify-center">
                        <PhoneScreenshot
                            src="/marketing/screenshot-playlist-editor.png"
                            alt="Playlist editor mobile view"
                        />
                    </div>

                    {/* Text — right */}
                    <div>
                        <SectionNumber n="07" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            Playlists &amp; Slideshows
                        </h2>
                        <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                            Combine multiple menus, promos, and specials into a
                            single rotating playlist. Drag to reorder, set
                            timing per slide, and reuse playlists across
                            locations.
                        </p>
                        <ul className="space-y-4">
                            <FeatureItem
                                icon={GripVertical}
                                text="Drag & drop reorder — build the perfect sequence in seconds"
                            />
                            <FeatureItem
                                icon={Sparkles}
                                text="Four transition types — fade, cut, slide left, and slide right between slides"
                            />
                            <FeatureItem
                                icon={Timer}
                                text="Configurable timing — set duration per slide (5 s to 5 min) and transition speed"
                            />
                            <FeatureItem
                                icon={RefreshCw}
                                text="Auto-refreshing URLs — playlists update live as you edit"
                            />
                            <FeatureItem
                                icon={Layers}
                                text="Reusable across screens — edit once, every screen updates automatically"
                            />
                        </ul>
                    </div>
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  09 — MULTI-SCREEN SYNC                                 */}
            {/* ====================================================== */}
            <SectionWrapper className="bg-neutral-50">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <SectionNumber n="09" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                        Multi-Screen Sync
                    </h2>
                    <p className="text-lg text-neutral-500 leading-relaxed max-w-2xl mx-auto">
                        Show the same content on multiple screens without HDMI
                        splitters, mini PCs, or extra hardware. Pure
                        software-only sync &mdash; works on any device with a
                        browser. One-toggle setup on the Screen Set page and
                        every display stays in lockstep.
                    </p>
                </div>

                {/* Savings callout */}
                <div className="rounded-2xl border border-[#4e7e8c]/20 bg-[#4e7e8c]/5 p-8 md:p-12 mb-16 text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#4e7e8c] mb-3">
                        No extra hardware
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-neutral-950 mb-4">
                        Save &pound;200&ndash;500+ per location
                    </p>
                    <p className="text-neutral-500 max-w-xl mx-auto">
                        No HDMI splitters, no dedicated media players, no extra
                        PCs. Each screen runs its own lightweight player —
                        synced in software.
                    </p>
                </div>

                {/* Use cases */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Store,
                            title: "QSR & Drive-Through",
                            desc: "Mirror your menu across indoor boards and the drive-through lane — always in sync, zero wiring.",
                        },
                        {
                            icon: MonitorPlay,
                            title: "Lobby & Reception",
                            desc: "Welcome screens, wayfinding, and promotional loops running identically on every display.",
                        },
                        {
                            icon: Building2,
                            title: "Multi-Location Chains",
                            desc: "Push one update to hundreds of screens across every branch. One click, every location.",
                        },
                    ].map((uc) => (
                        <div
                            key={uc.title}
                            className="rounded-2xl border border-neutral-200 bg-white p-8"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4e7e8c]/10 text-[#4e7e8c] mb-6">
                                <uc.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-3">
                                {uc.title}
                            </h3>
                            <p className="text-neutral-500 text-sm leading-relaxed">
                                {uc.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap justify-center gap-3 mt-12">
                    {[
                        { icon: ToggleLeft, label: "One-toggle setup" },
                        { icon: Wifi, label: "Software-only sync" },
                        { icon: Smartphone, label: "Any device" },
                    ].map((badge) => (
                        <span
                            key={badge.label}
                            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700"
                        >
                            <badge.icon className="h-4 w-4 text-[#4e7e8c]" />
                            {badge.label}
                        </span>
                    ))}
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  10 — LIVE STREAMS                                      */}
            {/* ====================================================== */}
            <SectionWrapper>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text — left */}
                    <div>
                        <SectionNumber n="10" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            Stream Live to Any&nbsp;Screen
                        </h2>
                        <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                            Connect an HLS or DASH live feed &mdash; sports
                            events, live TV, kitchen cameras, emergency alerts.
                            If the stream drops, screens automatically switch to
                            your fallback image. No black screens, ever.
                        </p>
                        <ul className="space-y-4">
                            <FeatureItem
                                icon={Radio}
                                text="HLS & DASH streaming — industry-standard protocols, paste a URL and go live"
                            />
                            <FeatureItem
                                icon={Volume2}
                                text="Per-stream audio control — enable or mute audio for each stream individually"
                            />
                            <FeatureItem
                                icon={ImageOff}
                                text="Automatic fallback — set a backup image that shows when the feed goes offline"
                            />
                            <FeatureItem
                                icon={CalendarDays}
                                text="Schedulable — assign streams to time slots, just like media or playlists"
                            />
                        </ul>
                    </div>

                    {/* Visual — right (dark card mockup) */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-md bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                                    Live
                                </span>
                                <span className="text-neutral-500 text-xs ml-auto">
                                    HLS &middot; Muted
                                </span>
                            </div>
                            <div className="aspect-video flex items-center justify-center">
                                <Radio className="h-20 w-20 text-neutral-700" />
                            </div>
                            <div className="px-4 py-3 border-t border-neutral-800">
                                <p className="text-white text-sm font-medium">
                                    Sky Sports Main Event
                                </p>
                                <p className="text-neutral-500 text-xs">
                                    Fallback: menu-board-default.png
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* ====================================================== */}
            {/*  CTA                                                    */}
            {/* ====================================================== */}
            <SectionWrapper dark className="text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Ready to See It in Action?
                </h2>
                <p className="text-neutral-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                    Book a 15-minute walkthrough and see how Onesign Display can
                    simplify menu management for your team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-medium text-neutral-950 shadow-sm hover:bg-neutral-200 transition-colors"
                    >
                        Book a Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center rounded-lg border border-white/20 px-8 py-4 text-base font-medium text-white hover:bg-white/10 transition-colors"
                    >
                        View Pricing
                    </Link>
                </div>
            </SectionWrapper>
        </>
    );
}
