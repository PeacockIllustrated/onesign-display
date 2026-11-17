'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalisePairingCode } from '@/lib/player/pairing'

export type PairResult = { ok: true } | { ok: false, error: string }

/**
 * Link a code shown on a TV to this screen. The TV is polling
 * /api/player/pair and picks up the screen's player token on its next poll.
 */
export async function pairScreenWithCode(screenId: string, rawCode: string): Promise<PairResult> {
    const code = normalisePairingCode(rawCode)
    if (!code) return { ok: false, error: 'That code doesn’t look right. It’s six letters and numbers, like K7Q-29P.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Please sign in again.' }

    const { data: screen } = await supabase.from('display_screens')
        .select('id, store:display_stores(client_id)')
        .eq('id', screenId)
        .single()
    if (!screen) return { ok: false, error: 'Screen not found.' }

    const { data: profile } = await supabase.from('display_profiles').select('role, client_id').eq('id', user.id).single()
    const storeClientId = (screen.store as unknown as { client_id: string } | null)?.client_id
    const allowed = profile?.role === 'super_admin' || (profile?.role === 'client_admin' && profile.client_id === storeClientId)
    if (!allowed) return { ok: false, error: 'You don’t have permission to pair this screen.' }

    const admin = await createAdminClient()
    const { data: claimed, error } = await admin
        .from('display_pairing_codes')
        .update({ screen_id: screenId, claimed_at: new Date().toISOString(), claimed_by: user.id })
        .eq('code', code)
        .is('claimed_at', null)
        .gt('expires_at', new Date().toISOString())
        .select('code')

    if (error) {
        console.error('[pairScreenWithCode]', error.message)
        return { ok: false, error: 'Pairing isn’t available right now. Try again in a minute.' }
    }
    if (!claimed || claimed.length === 0) {
        return { ok: false, error: 'Code not found or expired. Check the TV for its current code.' }
    }

    revalidatePath(`/app/screens/${screenId}`)
    return { ok: true }
}
