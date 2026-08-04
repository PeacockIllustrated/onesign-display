-- Overnight schedule windows.
--
-- The resolver matched with `v_time >= start_time AND v_time < end_time`, which
-- is unsatisfiable when start is after end. A late-night window such as
-- 21:00–02:00 therefore saved successfully, listed in the dashboard, and never
-- once appeared on a screen — with no error anywhere.
--
-- Day-of-week semantics for a wrapped window follow the day it STARTS on. A
-- schedule set to Friday at 21:00–02:00 runs Friday 21:00 through Saturday
-- 02:00; it does not begin again at Saturday midnight unless Saturday is also
-- selected. The morning portion is therefore matched against YESTERDAY's
-- weekday and date, which is also what the date_start/date_end window is
-- checked against for those hours.
--
-- A zero-length window (start = end) can never match and is rejected in the
-- application layer; it is treated as no-match here rather than as "all day",
-- since guessing the operator's intent would be worse than declining.

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
    v_date_prev date;
    v_dow_prev int;
BEGIN
    SELECT st.timezone INTO v_tz
    FROM display_screens sc
    JOIN display_stores st ON sc.store_id = st.id
    WHERE sc.id = p_screen_id;

    v_tz := COALESCE(v_tz, 'Europe/London');

    v_time := (p_now AT TIME ZONE v_tz)::time;
    v_date := (p_now AT TIME ZONE v_tz)::date;
    v_dow  := EXTRACT(dow FROM (p_now AT TIME ZONE v_tz))::int;

    -- The "logical" day for the early-hours tail of an overnight window.
    v_date_prev := v_date - 1;
    v_dow_prev  := (v_dow + 6) % 7;

    -- 1. Check schedules (strongest priority first; newest wins a tie)
    SELECT ssc.media_asset_id, ssc.playlist_id, ssc.stream_id, ssc.html_menu_id
    INTO v_media_id, v_playlist_id, v_stream_id, v_html_menu_id
    FROM display_scheduled_screen_content ssc
    JOIN display_schedules s ON ssc.schedule_id = s.id
    WHERE ssc.screen_id = p_screen_id
        AND CASE
            -- Same-day window: 11:00–14:00
            WHEN s.start_time < s.end_time THEN
                v_dow = ANY(s.days_of_week)
                AND v_time >= s.start_time
                AND v_time <  s.end_time
                AND (s.date_start IS NULL OR s.date_start <= v_date)
                AND (s.date_end   IS NULL OR s.date_end   >= v_date)

            -- Wrapped window: 21:00–02:00
            WHEN s.start_time > s.end_time THEN
                -- Evening portion, belongs to today
                (
                    v_dow = ANY(s.days_of_week)
                    AND v_time >= s.start_time
                    AND (s.date_start IS NULL OR s.date_start <= v_date)
                    AND (s.date_end   IS NULL OR s.date_end   >= v_date)
                )
                OR
                -- Early-hours portion, belongs to yesterday
                (
                    v_dow_prev = ANY(s.days_of_week)
                    AND v_time < s.end_time
                    AND (s.date_start IS NULL OR s.date_start <= v_date_prev)
                    AND (s.date_end   IS NULL OR s.date_end   >= v_date_prev)
                )

            -- start = end: zero-length, never matches
            ELSE false
        END
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
