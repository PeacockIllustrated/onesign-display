-- ============================================================
-- Live Streams: HLS/DASH stream support for screens
-- ============================================================

-- 1. Streams table
CREATE TABLE IF NOT EXISTS public.display_streams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.display_clients(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    stream_url text NOT NULL,
    stream_type text NOT NULL DEFAULT 'hls'
        CHECK (stream_type IN ('hls', 'dash', 'embed')),
    audio_enabled boolean NOT NULL DEFAULT false,
    fallback_media_asset_id uuid REFERENCES public.display_media_assets(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add stream_id to screen content
ALTER TABLE public.display_screen_content
    ADD COLUMN IF NOT EXISTS stream_id uuid REFERENCES public.display_streams(id) ON DELETE SET NULL;

-- Drop old 2-way constraint, replace with 3-way (exactly one of three)
ALTER TABLE public.display_screen_content
    DROP CONSTRAINT IF EXISTS screen_content_one_source;

ALTER TABLE public.display_screen_content
    ADD CONSTRAINT screen_content_one_source CHECK (
        (CASE WHEN media_asset_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN playlist_id    IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN stream_id      IS NOT NULL THEN 1 ELSE 0 END) = 1
    );

-- 3. Add stream_id to scheduled screen content
ALTER TABLE public.display_scheduled_screen_content
    ADD COLUMN IF NOT EXISTS stream_id uuid REFERENCES public.display_streams(id) ON DELETE SET NULL;

ALTER TABLE public.display_scheduled_screen_content
    DROP CONSTRAINT IF EXISTS sched_content_one_source;

ALTER TABLE public.display_scheduled_screen_content
    ADD CONSTRAINT sched_content_one_source CHECK (
        (CASE WHEN media_asset_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN playlist_id    IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN stream_id      IS NOT NULL THEN 1 ELSE 0 END) = 1
    );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_display_streams_client_id ON display_streams(client_id);
CREATE INDEX IF NOT EXISTS idx_display_screen_content_stream ON display_screen_content(stream_id);
CREATE INDEX IF NOT EXISTS idx_display_sched_content_stream ON display_scheduled_screen_content(stream_id);

-- 5. RLS
ALTER TABLE display_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "display: View streams" ON display_streams FOR SELECT USING (
    client_id = (SELECT client_id FROM display_get_user_role())
    OR (SELECT role FROM display_get_user_role()) = 'super_admin'
);
CREATE POLICY "display: Manage streams" ON display_streams FOR ALL USING (
    client_id = (SELECT client_id FROM display_get_user_role())
    OR (SELECT role FROM display_get_user_role()) = 'super_admin'
);

-- 6. Updated resolution function — now returns stream_id as well
-- Must DROP first because the return type is changing (adding resolved_stream_id column)
DROP FUNCTION IF EXISTS display_resolve_screen_content(uuid, timestamptz);

CREATE OR REPLACE FUNCTION display_resolve_screen_content(p_screen_id uuid, p_now timestamptz)
RETURNS TABLE(resolved_media_id uuid, resolved_playlist_id uuid, resolved_stream_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_media_id uuid;
    v_playlist_id uuid;
    v_stream_id uuid;
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
    SELECT ssc.media_asset_id, ssc.playlist_id, ssc.stream_id
    INTO v_media_id, v_playlist_id, v_stream_id
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

    IF v_media_id IS NOT NULL OR v_playlist_id IS NOT NULL OR v_stream_id IS NOT NULL THEN
        RETURN QUERY SELECT v_media_id, v_playlist_id, v_stream_id;
        RETURN;
    END IF;

    -- 2. Fallback to active content
    SELECT sc.media_asset_id, sc.playlist_id, sc.stream_id
    INTO v_media_id, v_playlist_id, v_stream_id
    FROM display_screen_content sc
    WHERE sc.screen_id = p_screen_id AND sc.active = true
    LIMIT 1;

    RETURN QUERY SELECT v_media_id, v_playlist_id, v_stream_id;
END;
$$;
