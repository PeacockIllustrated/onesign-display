-- ============================================================
-- Screen Status & Audit Trail (Phase 1)
-- Adds denormalised status to display_screens, a device-events table,
-- and the missing RLS policies on display_audit_log.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- 1. Status columns on display_screens
ALTER TABLE public.display_screens
    ADD COLUMN IF NOT EXISTS current_status text
        DEFAULT 'never_connected' NOT NULL,
    ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

-- CHECK constraint (drop-and-recreate so reruns don't fail)
ALTER TABLE public.display_screens
    DROP CONSTRAINT IF EXISTS display_screens_current_status_check;
ALTER TABLE public.display_screens
    ADD CONSTRAINT display_screens_current_status_check
    CHECK (current_status IN ('online','offline','error','never_connected'));

-- Backfill: any screen that has pinged within 3 minutes is online; otherwise
-- offline if it's pinged before, never_connected if it hasn't.
UPDATE public.display_screens
SET current_status = CASE
    WHEN last_seen_at IS NULL THEN 'never_connected'
    WHEN last_seen_at > now() - interval '3 minutes' THEN 'online'
    ELSE 'offline'
END
WHERE current_status = 'never_connected';

CREATE INDEX IF NOT EXISTS idx_display_screens_status
    ON public.display_screens (current_status);

-- 2. Device-events table (separate from display_audit_log on purpose:
--    device telemetry has different shape, volume, and retention)
CREATE TABLE IF NOT EXISTS public.display_screen_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id uuid REFERENCES public.display_screens(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL,
    severity text NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info','warning','error')),
    details jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screen_events_screen_time
    ON public.display_screen_events (screen_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screen_events_severity_time
    ON public.display_screen_events (created_at DESC)
    WHERE severity IN ('warning','error');

-- 3. RLS
ALTER TABLE display_screen_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "display: View screen_events" ON display_screen_events;
CREATE POLICY "display: View screen_events" ON display_screen_events FOR SELECT USING (
    (SELECT role FROM display_get_user_role()) = 'super_admin'
    OR EXISTS (
        SELECT 1 FROM display_screens sc
        JOIN display_stores st ON st.id = sc.store_id
        WHERE sc.id = display_screen_events.screen_id
          AND st.client_id = (SELECT client_id FROM display_get_user_role())
    )
);

-- 4. Add the missing read policy for the existing audit log
--    (RLS was already enabled but no policies meant nobody could SELECT)
DROP POLICY IF EXISTS "display: View audit_log" ON display_audit_log;
CREATE POLICY "display: View audit_log" ON display_audit_log FOR SELECT USING (
    (SELECT role FROM display_get_user_role()) = 'super_admin'
    OR client_id = (SELECT client_id FROM display_get_user_role())
);
