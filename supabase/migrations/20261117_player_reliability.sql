-- ============================================================
-- Player reliability (audit, Nov 2026)
--  1. player_info on display_screens: what browser/device each screen runs
--  2. display_pairing_codes: pair a TV with a short code instead of a token
-- Idempotent: safe to run multiple times. Purely additive.
-- ============================================================

-- 1. Device report written by /api/player/ping
ALTER TABLE public.display_screens
    ADD COLUMN IF NOT EXISTS player_info jsonb;

-- 2. Short-code pairing
--    The TV opens /pair, gets a code like K7Q-29P and shows it. Someone types
--    the code into the portal on the screen's page; the TV then picks up its
--    player token by itself. Only the server (service role) touches this
--    table, so RLS is on with no policies.
CREATE TABLE IF NOT EXISTS public.display_pairing_codes (
    code text PRIMARY KEY,
    device_secret text NOT NULL,
    screen_id uuid REFERENCES public.display_screens(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    claimed_at timestamptz,
    claimed_by uuid,
    collected_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pairing_codes_expires
    ON public.display_pairing_codes (expires_at);

ALTER TABLE public.display_pairing_codes ENABLE ROW LEVEL SECURITY;
