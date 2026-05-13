import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { Mail, Phone, MapPin, Clock, Tv, Wifi, Key, RotateCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Support — Onesign Display",
    description:
        "Get help with Onesign Display. Contact options, setup guides, troubleshooting, and frequently asked questions.",
};

export default function SupportPage() {
    return (
        <>
            <MarketingHero
                pill="We're here to help"
                headline="Support"
                subhead="Get up and running fast, or troubleshoot an issue with your screens. We're a small UK team and we answer every message."
                primaryCta={{ href: "mailto:tom@onesignanddigital.com", label: "Email Support" }}
            />

            {/* Contact methods */}
            <SectionWrapper>
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ContactCard
                            icon={<Mail className="h-6 w-6 text-neutral-950" />}
                            title="Email"
                            primary="tom@onesignanddigital.com"
                            secondary="Monitored anytime, replies in working hours"
                            href="mailto:tom@onesignanddigital.com"
                        />
                        <ContactCard
                            icon={<Phone className="h-6 w-6 text-neutral-950" />}
                            title="Phone"
                            primary="0191 487 6767"
                            secondary="Mon–Thu 9am–4pm, Fri 9am–12pm UK time"
                            href="tel:+441914876767"
                        />
                        <ContactCard
                            icon={<MapPin className="h-6 w-6 text-neutral-950" />}
                            title="Visit us"
                            primary="D86, Princesway North"
                            secondary="Gateshead NE11 0TU"
                        />
                    </div>
                </div>
            </SectionWrapper>

            {/* TV setup checklist */}
            <SectionWrapper className="!bg-neutral-50">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        TV setup checklist
                    </h2>
                    <p className="text-neutral-500 mb-10 text-lg">
                        Follow these one-time settings on each LG TV to get the
                        most reliable 24/7 operation. Takes about 60 seconds per
                        screen.
                    </p>
                    <ol className="space-y-6">
                        <ChecklistItem
                            number={1}
                            title="Disable Auto Power Off"
                            body="Settings → General → Power Saving → Auto Power Off → Off. Stops the TV switching itself off after 4 hours of perceived inactivity."
                        />
                        <ChecklistItem
                            number={2}
                            title="Disable Eco Mode"
                            body="Settings → General → Eco → Off. Eco Mode dims the screen when content is 'static' — menu boards count as static to the TV's heuristics."
                        />
                        <ChecklistItem
                            number={3}
                            title="Turn off SIMPLINK (HDMI-CEC)"
                            body="Settings → General → External Devices → SIMPLINK → Off. Prevents other connected devices from triggering the TV to power down."
                        />
                        <ChecklistItem
                            number={4}
                            title="Set a Power On Timer"
                            body="Settings → General → Timers → Power On Timer. Set to your trading hours so the TV switches itself on each morning automatically."
                        />
                        <ChecklistItem
                            number={5}
                            title="Disable the screensaver"
                            body="Settings → General → Screen Saver → Off (if available on your webOS version)."
                        />
                    </ol>
                </div>
            </SectionWrapper>

            {/* Common topics */}
            <SectionWrapper>
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10">
                        Common topics
                    </h2>
                    <div className="space-y-8">
                        <FaqItem
                            icon={<Key className="h-5 w-5 text-[#4e7e8c]" />}
                            question="Where do I find my pairing token?"
                            answer={
                                <>
                                    Sign in to the admin portal, open the{" "}
                                    <strong>Screens</strong> page, and click any
                                    screen to see its pairing token. New screens
                                    show a token immediately on creation; existing
                                    ones can have their token re-issued from the
                                    same page.
                                </>
                            }
                        />
                        <FaqItem
                            icon={<Tv className="h-5 w-5 text-[#4e7e8c]" />}
                            question="My screen is asleep or has gone black"
                            answer={
                                <>
                                    Most often this is a TV power-saving setting
                                    rather than a player issue. Run through the{" "}
                                    <a
                                        href="#tv-setup-checklist"
                                        className="text-[#4e7e8c] hover:underline"
                                    >
                                        TV setup checklist above
                                    </a>{" "}
                                    once per screen. If the problem persists after
                                    those settings are disabled, email us with
                                    the TV model number and webOS version and we
                                    will investigate.
                                </>
                            }
                        />
                        <FaqItem
                            icon={<Wifi className="h-5 w-5 text-[#4e7e8c]" />}
                            question="The screen says 'Offline' but my Wi-Fi works"
                            answer={
                                <>
                                    The player needs to reach{" "}
                                    <code className="text-sm bg-neutral-100 px-1 py-0.5 rounded">
                                        onesign-display.vercel.app
                                    </code>{" "}
                                    over HTTPS. If your network has content
                                    filtering (common in pubs and hospitality
                                    venues), ask whoever manages your network to
                                    allow that domain. Cached content will keep
                                    playing in offline mode until the connection
                                    is restored.
                                </>
                            }
                        />
                        <FaqItem
                            icon={<RotateCw className="h-5 w-5 text-[#4e7e8c]" />}
                            question="How do I re-pair a screen?"
                            answer={
                                <>
                                    On the TV, hold any remote button for 5
                                    seconds while the player is running. A
                                    confirmation modal appears — choose Reset to
                                    clear the stored token and return to the
                                    setup screen. Then enter the new pairing
                                    token from the admin portal.
                                </>
                            }
                        />
                        <FaqItem
                            icon={<Clock className="h-5 w-5 text-[#4e7e8c]" />}
                            question="How often does content update?"
                            answer={
                                <>
                                    Changes you make in the admin portal reach
                                    your screens within 60 seconds. Scheduled
                                    daypart changes happen at the exact second
                                    you set — within ±100ms when the player has a
                                    stable internet connection.
                                </>
                            }
                        />
                        <FaqItem
                            icon={<Tv className="h-5 w-5 text-[#4e7e8c]" />}
                            question="Which TVs does Onesign Display support?"
                            answer={
                                <>
                                    Any LG TV running webOS 4.0 or later. We
                                    recommend webOS 6.0+ for the most reliable
                                    keep-awake behaviour. For commercial 24/7
                                    deployments we recommend LG Signage displays
                                    (SM5KE, UM5N, UH5N series) over consumer
                                    TVs — the panels are warrantied for
                                    continuous operation and the OS removes the
                                    power-management restrictions you have to
                                    work around on consumer sets.
                                </>
                            }
                        />
                        <FaqItem
                            icon={<Mail className="h-5 w-5 text-[#4e7e8c]" />}
                            question="How do I cancel my subscription?"
                            answer={
                                <>
                                    Email{" "}
                                    <a
                                        href="mailto:tom@onesignanddigital.com"
                                        className="text-[#4e7e8c] hover:underline"
                                    >
                                        tom@onesignanddigital.com
                                    </a>{" "}
                                    and we will cancel your subscription within
                                    one working day. Your screens will continue
                                    to show your last-published content until the
                                    end of your billing period, then go to a
                                    "subscription expired" message.
                                </>
                            }
                        />
                    </div>
                </div>
            </SectionWrapper>

            {/* Status / final CTA */}
            <SectionWrapper className="!bg-neutral-50">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Still need help?
                    </h2>
                    <p className="text-neutral-500 mb-8 text-lg">
                        We answer every email personally — usually within a few
                        hours during UK working time.
                    </p>
                    <a
                        href="mailto:tom@onesignanddigital.com"
                        className="inline-flex items-center justify-center rounded-lg bg-neutral-950 text-white px-8 py-4 text-base font-medium hover:bg-neutral-800 transition-colors"
                    >
                        Email tom@onesignanddigital.com
                    </a>
                </div>
            </SectionWrapper>
        </>
    );
}

function ContactCard({
    icon,
    title,
    primary,
    secondary,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    primary: string;
    secondary: string;
    href?: string;
}) {
    const inner = (
        <div className="p-8 border border-neutral-200 rounded-2xl text-center h-full hover:border-neutral-300 transition-colors">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-neutral-950 font-medium mb-1">{primary}</p>
            <p className="text-neutral-500 text-sm">{secondary}</p>
        </div>
    );
    if (href) {
        return (
            <a href={href} className="block">
                {inner}
            </a>
        );
    }
    return inner;
}

function ChecklistItem({
    number,
    title,
    body,
}: {
    number: number;
    title: string;
    body: string;
}) {
    return (
        <li className="flex gap-5">
            <div className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#4e7e8c] text-white font-bold">
                {number}
            </div>
            <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-neutral-600 leading-relaxed">{body}</p>
            </div>
        </li>
    );
}

function FaqItem({
    icon,
    question,
    answer,
}: {
    icon: React.ReactNode;
    question: string;
    answer: React.ReactNode;
}) {
    return (
        <div className="border-b border-neutral-200 pb-8 last:border-0">
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <h3 className="font-bold text-xl">{question}</h3>
            </div>
            <p className="text-neutral-600 leading-relaxed pl-8">{answer}</p>
        </div>
    );
}
