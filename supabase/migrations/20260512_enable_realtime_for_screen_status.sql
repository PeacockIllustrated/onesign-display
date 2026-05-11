-- ============================================================
-- Screen Audit Trail — Phase 3b
-- Enable Supabase Realtime publication on the two tables so the
-- dashboard and per-screen timeline can subscribe to live updates.
-- Idempotent: catches duplicate_object so repeat runs are safe.
-- ============================================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.display_screens;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.display_screen_events;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
