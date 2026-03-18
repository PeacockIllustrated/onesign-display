-- ============================================================
-- Playlists: reusable slide sequences for screens
-- ============================================================

-- 1. Playlists table
CREATE TABLE IF NOT EXISTS public.display_playlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.display_clients(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    transition text NOT NULL DEFAULT 'fade'
        CHECK (transition IN ('fade', 'cut', 'slide_left', 'slide_right')),
    transition_duration_ms int NOT NULL DEFAULT 500,
    loop boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Playlist items (ordered slides)
CREATE TABLE IF NOT EXISTS public.display_playlist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id uuid REFERENCES public.display_playlists(id) ON DELETE CASCADE NOT NULL,
    media_asset_id uuid REFERENCES public.display_media_assets(id) ON DELETE RESTRICT NOT NULL,
    position int NOT NULL DEFAULT 1,
    duration_seconds int NOT NULL DEFAULT 10,
    created_at timestamptz DEFAULT now(),
    UNIQUE (playlist_id, position)
);

-- 3. Modify display_screen_content to support playlists
ALTER TABLE public.display_screen_content
    ADD COLUMN IF NOT EXISTS playlist_id uuid REFERENCES public.display_playlists(id) ON DELETE SET NULL;

ALTER TABLE public.display_screen_content
    ALTER COLUMN media_asset_id DROP NOT NULL;

-- Ensure exactly one of media_asset_id or playlist_id is set
ALTER TABLE public.display_screen_content
    ADD CONSTRAINT screen_content_one_source
    CHECK (
        (media_asset_id IS NOT NULL AND playlist_id IS NULL) OR
        (media_asset_id IS NULL AND playlist_id IS NOT NULL)
    );

-- 4. Modify display_scheduled_screen_content to support playlists
ALTER TABLE public.display_scheduled_screen_content
    ADD COLUMN IF NOT EXISTS playlist_id uuid REFERENCES public.display_playlists(id) ON DELETE SET NULL;

ALTER TABLE public.display_scheduled_screen_content
    ALTER COLUMN media_asset_id DROP NOT NULL;

ALTER TABLE public.display_scheduled_screen_content
    ADD CONSTRAINT sched_content_one_source
    CHECK (
        (media_asset_id IS NOT NULL AND playlist_id IS NULL) OR
        (media_asset_id IS NULL AND playlist_id IS NOT NULL)
    );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_display_playlists_client_id ON display_playlists(client_id);
CREATE INDEX IF NOT EXISTS idx_display_playlist_items_playlist ON display_playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_display_screen_content_playlist ON display_screen_content(playlist_id);
CREATE INDEX IF NOT EXISTS idx_display_sched_content_playlist ON display_scheduled_screen_content(playlist_id);

-- 6. RLS
ALTER TABLE display_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_playlist_items ENABLE ROW LEVEL SECURITY;

-- Playlists: client-scoped
CREATE POLICY "display: View playlists" ON display_playlists FOR SELECT USING (
    client_id = (SELECT client_id FROM display_get_user_role())
    OR (SELECT role FROM display_get_user_role()) = 'super_admin'
);
CREATE POLICY "display: Manage playlists" ON display_playlists FOR ALL USING (
    client_id = (SELECT client_id FROM display_get_user_role())
    OR (SELECT role FROM display_get_user_role()) = 'super_admin'
);

-- Playlist items: scoped via playlist's client_id
CREATE POLICY "display: View playlist_items" ON display_playlist_items FOR SELECT TO authenticated USING (
    playlist_id IN (
        SELECT id FROM display_playlists WHERE
            client_id = (SELECT client_id FROM display_get_user_role())
            OR (SELECT role FROM display_get_user_role()) = 'super_admin'
    )
);
CREATE POLICY "display: Insert playlist_items" ON display_playlist_items FOR INSERT TO authenticated WITH CHECK (
    playlist_id IN (
        SELECT id FROM display_playlists WHERE
            client_id = (SELECT client_id FROM display_get_user_role())
            OR (SELECT role FROM display_get_user_role()) = 'super_admin'
    )
);
CREATE POLICY "display: Update playlist_items" ON display_playlist_items FOR UPDATE TO authenticated USING (
    playlist_id IN (
        SELECT id FROM display_playlists WHERE
            client_id = (SELECT client_id FROM display_get_user_role())
            OR (SELECT role FROM display_get_user_role()) = 'super_admin'
    )
);
CREATE POLICY "display: Delete playlist_items" ON display_playlist_items FOR DELETE TO authenticated USING (
    playlist_id IN (
        SELECT id FROM display_playlists WHERE
            client_id = (SELECT client_id FROM display_get_user_role())
            OR (SELECT role FROM display_get_user_role()) = 'super_admin'
    )
);

-- 7. Updated resolution function — returns playlist_id as well
CREATE OR REPLACE FUNCTION display_resolve_screen_content(p_screen_id uuid, p_now timestamptz)
RETURNS TABLE(resolved_media_id uuid, resolved_playlist_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_media_id uuid;
    v_playlist_id uuid;
    v_tz text;
    v_time time;
    v_date date;
    v_dow int;
BEGIN
    -- Resolve store timezone
    SELECT st.timezone INTO v_tz
    FROM display_screens sc
    JOIN display_stores st ON sc.store_id = st.id
    WHERE sc.id = p_screen_id;

    v_tz := COALESCE(v_tz, 'Europe/London');

    v_time := (p_now AT TIME ZONE v_tz)::time;
    v_date := (p_now AT TIME ZONE v_tz)::date;
    v_dow  := EXTRACT(dow FROM (p_now AT TIME ZONE v_tz))::int;

    -- 1. Check schedules (highest priority first)
    SELECT ssc.media_asset_id, ssc.playlist_id
    INTO v_media_id, v_playlist_id
    FROM display_scheduled_screen_content ssc
    JOIN display_schedules s ON ssc.schedule_id = s.id
    WHERE ssc.screen_id = p_screen_id
        AND v_dow = ANY(s.days_of_week)
        AND v_time >= s.start_time
        AND v_time < s.end_time
        AND (s.date_start IS NULL OR s.date_start <= v_date)
        AND (s.date_end IS NULL OR s.date_end >= v_date)
    ORDER BY s.priority ASC, s.created_at DESC
    LIMIT 1;

    IF v_media_id IS NOT NULL OR v_playlist_id IS NOT NULL THEN
        RETURN QUERY SELECT v_media_id, v_playlist_id;
        RETURN;
    END IF;

    -- 2. Fallback to active content
    SELECT sc.media_asset_id, sc.playlist_id
    INTO v_media_id, v_playlist_id
    FROM display_screen_content sc
    WHERE sc.screen_id = p_screen_id AND sc.active = true
    LIMIT 1;

    RETURN QUERY SELECT v_media_id, v_playlist_id;
END;
$$;
