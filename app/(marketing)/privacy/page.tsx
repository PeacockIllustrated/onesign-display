import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy — Onesign Display",
    description:
        "How Onesign & Digital collects, uses, and protects data for the Onesign Display digital signage platform.",
};

const LAST_UPDATED = "11 May 2026";

export default function PrivacyPage() {
    return (
        <>
            <MarketingHero
                headline="Privacy Policy"
                subhead={`How we handle data for the Onesign Display platform. Last updated ${LAST_UPDATED}.`}
            />

            <SectionWrapper>
                <div className="max-w-3xl mx-auto [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-neutral-700 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2 [&_li]:text-neutral-700 [&_li]:leading-relaxed [&_a]:text-[#4e7e8c] hover:[&_a]:underline">
                    <h2>Who we are</h2>
                    <p>
                        Onesign Display is operated by{" "}
                        <strong>Onesign &amp; Digital</strong>, a sign-making and
                        digital signage company based in Gateshead, United Kingdom.
                        We are the data controller for any personal data processed
                        through the Onesign Display platform.
                    </p>
                    <p>
                        <strong>Registered address:</strong> D86, Princesway North,
                        Gateshead, NE11 0TU, United Kingdom
                        <br />
                        <strong>Contact:</strong>{" "}
                        <a href="mailto:tom@onesignanddigital.com">
                            tom@onesignanddigital.com
                        </a>{" "}
                        · 0191 487 6767
                    </p>

                    <h2>What this policy covers</h2>
                    <p>
                        This policy describes how we collect, use, store, and
                        share information when you use the Onesign Display
                        platform — including the web admin portal at
                        onesign-display.vercel.app, the player application
                        running on your screens, and our LG webOS Content Store
                        app.
                    </p>

                    <h2>Information we collect</h2>

                    <h3>Account information</h3>
                    <p>When you sign up for an Onesign Display account we collect:</p>
                    <ul>
                        <li>Your name and business name</li>
                        <li>Your email address</li>
                        <li>Your business address and contact phone number</li>
                        <li>Billing details (processed by Stripe — see below)</li>
                    </ul>

                    <h3>Content you upload</h3>
                    <p>
                        Menu items, images, videos, schedules, and any other
                        content you create within the platform. This is your
                        content; we process it only to deliver it to your screens.
                    </p>

                    <h3>Technical and device data</h3>
                    <p>
                        To run a reliable signage service we collect technical
                        information from your screens and admin sessions:
                    </p>
                    <ul>
                        <li>
                            <strong>Pairing tokens</strong> — unique identifiers
                            linking a TV to your account
                        </li>
                        <li>
                            <strong>Device heartbeats</strong> — periodic pings
                            from each screen confirming it is online, the screen
                            resolution, and the player version
                        </li>
                        <li>
                            <strong>IP addresses</strong> — recorded when screens
                            connect to our servers, used for diagnostics and
                            security
                        </li>
                        <li>
                            <strong>Browser/device user-agent strings</strong> —
                            used to detect TV model and tune player behaviour
                        </li>
                        <li>
                            <strong>Error and performance logs</strong> — used to
                            diagnose playback issues
                        </li>
                    </ul>

                    <h3>Cookies and local storage</h3>
                    <p>
                        The admin portal uses essential cookies to keep you
                        signed in and remember your preferences. Player devices
                        use browser local storage to cache the pairing token and
                        last-known content manifest for offline resilience. We do
                        not use analytics or advertising cookies on the player.
                    </p>
                    <p>
                        On the marketing site (onesign-display.vercel.app) we
                        use basic privacy-friendly analytics to understand which
                        pages are viewed. No third-party advertising trackers are
                        used.
                    </p>

                    <h2>Why we process this data</h2>
                    <p>We process data under the following lawful bases:</p>
                    <ul>
                        <li>
                            <strong>Contract</strong> — to deliver the Onesign
                            Display service you have subscribed to, including
                            displaying your content on your screens, handling
                            billing, and providing support
                        </li>
                        <li>
                            <strong>Legitimate interest</strong> — to monitor
                            service health, prevent fraud, diagnose technical
                            issues, and improve the platform
                        </li>
                        <li>
                            <strong>Legal obligation</strong> — to comply with UK
                            tax, accounting, and consumer-rights law
                        </li>
                    </ul>

                    <h2>How long we keep data</h2>
                    <ul>
                        <li>
                            <strong>Active account data</strong> — for as long as
                            your subscription is active
                        </li>
                        <li>
                            <strong>Content (menus, images, videos)</strong> —
                            until you delete it, or for 90 days after account
                            cancellation, after which it is permanently removed
                        </li>
                        <li>
                            <strong>Billing records</strong> — 7 years (UK tax
                            requirement)
                        </li>
                        <li>
                            <strong>Technical logs</strong> — 30 days, then
                            automatically purged
                        </li>
                        <li>
                            <strong>Support correspondence</strong> — 2 years
                            after the last interaction
                        </li>
                    </ul>

                    <h2>Who we share data with</h2>
                    <p>
                        We use a small number of carefully chosen processors to
                        run the service. We do not sell your data, and we do not
                        share it with advertisers.
                    </p>
                    <ul>
                        <li>
                            <strong>Supabase</strong> (hosted on AWS, EU region) —
                            our database and authentication provider
                        </li>
                        <li>
                            <strong>Vercel</strong> — hosts the admin portal and
                            player web application
                        </li>
                        <li>
                            <strong>Stripe</strong> — processes subscription
                            payments. Stripe stores card details on their PCI-DSS
                            certified infrastructure; we never see or store full
                            card numbers
                        </li>
                        <li>
                            <strong>Cloudflare</strong> — content delivery and
                            DDoS protection for player content
                        </li>
                    </ul>
                    <p>
                        Each processor is bound by a data processing agreement
                        with appropriate safeguards under UK GDPR. Where data is
                        transferred outside the UK/EEA, transfers use Standard
                        Contractual Clauses.
                    </p>

                    <h2>Your rights</h2>
                    <p>Under UK GDPR you have the right to:</p>
                    <ul>
                        <li>Access the personal data we hold about you</li>
                        <li>Correct inaccurate data</li>
                        <li>
                            Request deletion of your data (subject to our legal
                            retention obligations)
                        </li>
                        <li>Receive a portable copy of your data</li>
                        <li>Object to or restrict certain processing</li>
                        <li>Withdraw consent where consent is the lawful basis</li>
                        <li>
                            Complain to the UK Information Commissioner's Office
                            (<a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>)
                        </li>
                    </ul>
                    <p>
                        To exercise any of these rights, email{" "}
                        <a href="mailto:tom@onesignanddigital.com">
                            tom@onesignanddigital.com
                        </a>
                        . We will respond within 30 days.
                    </p>

                    <h2>Security</h2>
                    <p>
                        We take security seriously. Account passwords are hashed
                        and never stored in plaintext. All connections between
                        your screens, our servers, and your browser use TLS
                        encryption. Database access is restricted by row-level
                        security so each customer can only see their own data.
                        We maintain audit trails of significant administrative
                        actions.
                    </p>
                    <p>
                        If you believe an account has been compromised, contact{" "}
                        <a href="mailto:tom@onesignanddigital.com">
                            tom@onesignanddigital.com
                        </a>{" "}
                        immediately.
                    </p>

                    <h2>Children</h2>
                    <p>
                        Onesign Display is a business service. We do not knowingly
                        collect data from anyone under 18 years of age.
                    </p>

                    <h2>Changes to this policy</h2>
                    <p>
                        If we make material changes we will notify account
                        holders by email at least 14 days before the changes take
                        effect. The current version is always available at this
                        URL.
                    </p>

                    <h2>Contact</h2>
                    <p>
                        Questions about privacy or this policy? Email{" "}
                        <a href="mailto:tom@onesignanddigital.com">
                            tom@onesignanddigital.com
                        </a>{" "}
                        or write to us at the address at the top of this page.
                    </p>
                </div>
            </SectionWrapper>
        </>
    );
}
