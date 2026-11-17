/**
 * Emails someone when a screen has been offline for a while, so problems are
 * caught before the client notices. Runs from the screen-status cron.
 *
 * Off unless these are set in Vercel:
 *   RESEND_API_KEY        Resend API key
 *   SCREEN_ALERT_EMAIL    who to tell (comma-separated)
 *   SCREEN_ALERT_FROM     a sender on a domain verified in Resend,
 *                         e.g. "Onedesign Screens <screens@onedesignstudios.com>"
 *
 * Each offline spell alerts once: we record an 'offline_alert' event and
 * skip screens that already have one since they went offline.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

type Admin = SupabaseClient
type OfflineScreen = {
    id: string
    name: string
    last_seen_at: string | null
    status_changed_at: string
    store: { name: string } | null
}

export const ALERT_AFTER_MS = 10 * 60 * 1000
// Don't alert about screens that went quiet long ago (e.g. switched off for good).
const ALERT_WINDOW_MS = 24 * 60 * 60 * 1000

export function alertsConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.SCREEN_ALERT_EMAIL && process.env.SCREEN_ALERT_FROM)
}

export async function sendOfflineAlerts(supabase: Admin, now = new Date()): Promise<number> {
    if (!alertsConfigured()) return 0

    const olderThan = new Date(now.getTime() - ALERT_AFTER_MS).toISOString()
    const newerThan = new Date(now.getTime() - ALERT_WINDOW_MS).toISOString()

    const { data: offline, error } = await supabase
        .from('display_screens')
        .select('id, name, last_seen_at, status_changed_at, store:display_stores(name)')
        .eq('current_status', 'offline')
        .lt('status_changed_at', olderThan)
        .gt('status_changed_at', newerThan)
    if (error || !offline?.length) return 0
    const screens = offline as unknown as OfflineScreen[]

    const ids = screens.map(s => s.id)
    const { data: sent } = await supabase
        .from('display_screen_events')
        .select('screen_id, created_at')
        .eq('event_type', 'offline_alert')
        .in('screen_id', ids)
        .gt('created_at', newerThan)

    const due = screens.filter(s => !(sent ?? []).some((e: { screen_id: string, created_at: string }) =>
        e.screen_id === s.id && new Date(e.created_at) >= new Date(s.status_changed_at)))
    if (due.length === 0) return 0

    const fmt = (iso: string | null) => iso
        ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' })
        : 'never'
    const lines = due.map(s => `• ${s.store?.name ?? 'Unknown venue'}: ${s.name} (last seen ${fmt(s.last_seen_at)})`)
    const subject = due.length === 1
        ? `Screen offline: ${due[0].store?.name ?? ''} ${due[0].name}`.trim()
        : `${due.length} screens offline`
    const text = [
        `${due.length === 1 ? 'This screen has' : 'These screens have'} been offline for over ${ALERT_AFTER_MS / 60000} minutes:`,
        '',
        ...lines,
        '',
        'Usual causes: venue Wi-Fi down, the TV or player box switched off at the wall, or the TV on a different input.',
        'The screen keeps showing its last menu while offline if it has played it before.',
    ].join('\n')

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: process.env.SCREEN_ALERT_FROM,
            to: process.env.SCREEN_ALERT_EMAIL!.split(',').map(e => e.trim()).filter(Boolean),
            subject,
            text,
        }),
    }).catch((err: unknown) => { console.error('[alerts] send failed', err); return null })

    if (!res?.ok) {
        console.error('[alerts] Resend rejected the alert', res?.status)
        return 0
    }

    await supabase.from('display_screen_events').insert(due.map(s => ({
        screen_id: s.id,
        event_type: 'offline_alert',
        severity: 'warning',
        details: { emailed: true, last_seen_at: s.last_seen_at },
    })))
    return due.length
}
