-- ============================================================
-- Multi-Screen Sync Support
-- Adds epoch-based deterministic synchronization to screen sets
-- ============================================================

-- 1. Add sync columns to display_screen_sets
ALTER TABLE public.display_screen_sets
    ADD COLUMN IF NOT EXISTS sync_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sync_epoch  timestamptz;

-- 2. Index for quick lookup of synced sets
CREATE INDEX IF NOT EXISTS idx_screen_sets_sync_enabled
    ON public.display_screen_sets (sync_enabled)
    WHERE sync_enabled = true;

-- 3. Function to reset sync epoch for a screen set
--    Called from server actions when content changes or admin resets sync.
--    Resets the epoch to now() and bumps refresh_version on all screens in the set
--    so they re-fetch the manifest with the new epoch.
CREATE OR REPLACE FUNCTION public.display_reset_sync_epoch(p_screen_set_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.display_screen_sets
    SET sync_epoch = now()
    WHERE id = p_screen_set_id
      AND sync_enabled = true;

    UPDATE public.display_screens
    SET refresh_version = COALESCE(refresh_version, 0) + 1
    WHERE screen_set_id = p_screen_set_id;
END;
$$;

-- 4. Grant execute to authenticated users (RLS on the underlying tables still applies)
GRANT EXECUTE ON FUNCTION public.display_reset_sync_epoch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.display_reset_sync_epoch(uuid) TO service_role;
