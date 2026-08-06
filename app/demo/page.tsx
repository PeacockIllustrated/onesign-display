import type { Metadata } from 'next'
import DemoRoot from '@/components/demo/DemoRoot'

// The in-situ demo simulator: a virtual venue wall where displays are
// mounted, provisioned with the Onesign USB player, paired, and driven
// from a simulated phone — using the real sync math and the real menu
// rendering pipeline. See docs/superpowers/specs/
// 2026-08-05-demo-simulation-environment-design.md for the full design.
//
// A sales tool, not a product page: unlinked from the site and noindexed.

export const metadata: Metadata = {
    title: 'In-Situ Simulator — Onesign Display',
    robots: { index: false, follow: false },
}

export default function DemoPage() {
    return <DemoRoot />
}
