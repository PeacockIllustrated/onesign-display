'use client';

import { useState } from 'react';
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { DemoModal } from "@/components/marketing/DemoModal";
import { Mail, Calendar } from "lucide-react";

export default function ContactPage() {
    const [showDemoModal, setShowDemoModal] = useState(false);

    return (
        <>
            <MarketingHero
                headline="Let's talk."
                subhead="Ready to see Onesign Display in action? Book a demo with our team."
            />

            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                    <div className="p-8 border border-neutral-200 rounded-2xl text-center hover:border-neutral-300 transition-colors">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-6">
                            <Calendar className="h-6 w-6 text-neutral-950" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Book a Demo</h3>
                        <p className="text-neutral-500 mb-6">See a live walkthrough of the platform tailored to your needs.</p>
                        <button
                            onClick={() => setShowDemoModal(true)}
                            className="w-full bg-neutral-950 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                        >
                            Schedule Now
                        </button>
                    </div>

                    <div className="p-8 border border-neutral-200 rounded-2xl text-center hover:border-neutral-300 transition-colors">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-6">
                            <Mail className="h-6 w-6 text-neutral-950" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Email Sales</h3>
                        <p className="text-neutral-500 mb-6">Have questions? Drop us a line and we'll get back to you shortly.</p>
                        <a
                            href="mailto:tom@onesignanddigital.com"
                            className="w-full border border-neutral-200 text-neutral-950 py-3 rounded-lg font-medium hover:bg-neutral-50 transition-colors block"
                        >
                            tom@onesignanddigital.com
                        </a>
                    </div>
                </div>
            </SectionWrapper>

            <DemoModal
                isOpen={showDemoModal}
                onClose={() => setShowDemoModal(false)}
            />
        </>
    );
}

