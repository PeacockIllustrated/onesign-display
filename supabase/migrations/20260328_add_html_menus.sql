-- ============================================================
-- HTML Menus: editable themed HTML rendered into iframe srcdoc
-- ============================================================

-- 1. Menus table
CREATE TABLE IF NOT EXISTS public.display_html_menus (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.display_clients(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    theme_key text NOT NULL,
    content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    rendered_html text,
    rendered_at timestamptz,
    render_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add html_menu_id to screen content + 4-way exclusivity
ALTER TABLE public.display_screen_content
    ADD COLUMN IF NOT EXISTS html_menu_id uuid REFERENCES public.display_html_menus(id) ON DELETE SET NULL;

ALTER TABLE public.display_screen_content
    DROP CONSTRAINT IF EXISTS screen_content_one_source;

ALTER TABLE public.display_screen_content
    ADD CONSTRAINT screen_content_one_source CHECK (
        (CASE WHEN media_asset_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN playlist_id    IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN stream_id      IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN html_menu_id   IS NOT NULL THEN 1 ELSE 0 END) = 1
    );

-- 3. Same for scheduled screen content
ALTER TABLE public.display_scheduled_screen_content
    ADD COLUMN IF NOT EXISTS html_menu_id uuid REFERENCES public.display_html_menus(id) ON DELETE SET NULL;

ALTER TABLE public.display_scheduled_screen_content
    DROP CONSTRAINT IF EXISTS sched_content_one_source;

ALTER TABLE public.display_scheduled_screen_content
    ADD CONSTRAINT sched_content_one_source CHECK (
        (CASE WHEN media_asset_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN playlist_id    IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN stream_id      IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN html_menu_id   IS NOT NULL THEN 1 ELSE 0 END) = 1
    );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_display_html_menus_client_id ON display_html_menus(client_id);
CREATE INDEX IF NOT EXISTS idx_display_screen_content_html_menu ON display_screen_content(html_menu_id);
CREATE INDEX IF NOT EXISTS idx_display_sched_content_html_menu ON display_scheduled_screen_content(html_menu_id);

-- 5. RLS
ALTER TABLE display_html_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "display: View html menus" ON display_html_menus FOR SELECT USING (
    client_id = (SELECT client_id FROM display_get_user_role())
    OR (SELECT role FROM display_get_user_role()) = 'super_admin'
);
CREATE POLICY "display: Manage html menus" ON display_html_menus FOR ALL USING (
    client_id = (SELECT client_id FROM display_get_user_role())
    OR (SELECT role FROM display_get_user_role()) = 'super_admin'
);

-- 6. Resolution function — returns all four content kinds
DROP FUNCTION IF EXISTS display_resolve_screen_content(uuid, timestamptz);

CREATE OR REPLACE FUNCTION display_resolve_screen_content(p_screen_id uuid, p_now timestamptz)
RETURNS TABLE(
    resolved_media_id uuid,
    resolved_playlist_id uuid,
    resolved_stream_id uuid,
    resolved_html_menu_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_media_id uuid;
    v_playlist_id uuid;
    v_stream_id uuid;
    v_html_menu_id uuid;
    v_tz text;
    v_time time;
    v_date date;
    v_dow int;
BEGIN
    SELECT st.timezone INTO v_tz
    FROM display_screens sc
    JOIN display_stores st ON sc.store_id = st.id
    WHERE sc.id = p_screen_id;

    v_tz := COALESCE(v_tz, 'Europe/London');

    v_time := (p_now AT TIME ZONE v_tz)::time;
    v_date := (p_now AT TIME ZONE v_tz)::date;
    v_dow  := EXTRACT(dow FROM (p_now AT TIME ZONE v_tz))::int;

    -- 1. Check schedules (highest priority first)
    SELECT ssc.media_asset_id, ssc.playlist_id, ssc.stream_id, ssc.html_menu_id
    INTO v_media_id, v_playlist_id, v_stream_id, v_html_menu_id
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

    IF v_media_id IS NOT NULL OR v_playlist_id IS NOT NULL
       OR v_stream_id IS NOT NULL OR v_html_menu_id IS NOT NULL THEN
        RETURN QUERY SELECT v_media_id, v_playlist_id, v_stream_id, v_html_menu_id;
        RETURN;
    END IF;

    -- 2. Fallback to active content
    SELECT sc.media_asset_id, sc.playlist_id, sc.stream_id, sc.html_menu_id
    INTO v_media_id, v_playlist_id, v_stream_id, v_html_menu_id
    FROM display_screen_content sc
    WHERE sc.screen_id = p_screen_id AND sc.active = true
    LIMIT 1;

    RETURN QUERY SELECT v_media_id, v_playlist_id, v_stream_id, v_html_menu_id;
END;
$$;
