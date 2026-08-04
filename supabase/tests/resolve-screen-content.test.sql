-- Regression tests for display_resolve_screen_content.
--
-- Overnight windows were broken silently for a long time — a 21:00–02:00
-- schedule saved, listed, and never played, with no error anywhere. That class
-- of bug is invisible without a test, hence this file.
--
-- Run against a scratch database (NOT a real project):
--
--   initdb -D /tmp/odpg/data -U postgres --auth=trust
--   pg_ctl -D /tmp/odpg/data -o '-k /tmp/odpg/run -p 55432' -l /tmp/odpg/log start
--   psql -h /tmp/odpg/run -p 55432 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/migrations/20260804_overnight_schedules.sql \
--        -f supabase/tests/resolve-screen-content.test.sql
--
-- Postgres will not run as root; su to an unprivileged user first.
-- Every row must report PASS.

BEGIN;

-- ── Minimal schema slice ────────────────────────────────────────────────────
CREATE TEMP TABLE display_clients (id uuid PRIMARY KEY, name text);
CREATE TEMP TABLE display_stores (
  id uuid PRIMARY KEY, client_id uuid, name text, timezone text DEFAULT 'Europe/London');
CREATE TEMP TABLE display_screens (id uuid PRIMARY KEY, store_id uuid, name text);
CREATE TEMP TABLE display_media_assets (id uuid PRIMARY KEY, name text);
CREATE TEMP TABLE display_schedules (
  id uuid PRIMARY KEY, store_id uuid, name text NOT NULL, days_of_week int[] NOT NULL,
  start_time time NOT NULL, end_time time NOT NULL, date_start date, date_end date,
  priority int DEFAULT 10, created_at timestamptz DEFAULT now());
CREATE TEMP TABLE display_scheduled_screen_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), screen_id uuid, schedule_id uuid,
  media_asset_id uuid, playlist_id uuid, stream_id uuid, html_menu_id uuid);
CREATE TEMP TABLE display_screen_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), screen_id uuid, media_asset_id uuid,
  playlist_id uuid, stream_id uuid, html_menu_id uuid, active boolean DEFAULT true);

-- ── Fixtures ────────────────────────────────────────────────────────────────
INSERT INTO display_clients VALUES ('11111111-1111-1111-1111-111111111111','Acme');
INSERT INTO display_stores VALUES
  ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Newcastle','Europe/London');
INSERT INTO display_screens VALUES
  ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','Front');
INSERT INTO display_media_assets VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','LATE-NIGHT'),
  ('aaaaaaaa-0000-0000-0000-000000000002','LUNCH'),
  ('aaaaaaaa-0000-0000-0000-000000000003','DEFAULT'),
  ('aaaaaaaa-0000-0000-0000-000000000004','HAPPY-HOUR');

INSERT INTO display_screen_content (screen_id, media_asset_id, active)
  VALUES ('33333333-3333-3333-3333-333333333333','aaaaaaaa-0000-0000-0000-000000000003', true);

-- Overnight, Friday only: 21:00 -> 02:00 Saturday
INSERT INTO display_schedules (id, store_id, name, days_of_week, start_time, end_time, priority)
  VALUES ('44444444-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
          'Late Night','{5}','21:00','02:00',10);
INSERT INTO display_scheduled_screen_content (screen_id, schedule_id, media_asset_id)
  VALUES ('33333333-3333-3333-3333-333333333333','44444444-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001');

-- Same-day, every day: 11:00 -> 14:00
INSERT INTO display_schedules (id, store_id, name, days_of_week, start_time, end_time, priority)
  VALUES ('44444444-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',
          'Lunch','{0,1,2,3,4,5,6}','11:00','14:00',10);
INSERT INTO display_scheduled_screen_content (screen_id, schedule_id, media_asset_id)
  VALUES ('33333333-3333-3333-3333-333333333333','44444444-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002');

-- Overlaps Lunch at higher priority, and is deliberately OLDER so that a
-- resolver ignoring priority would pick Lunch on the created_at tiebreak.
INSERT INTO display_schedules (id, store_id, name, days_of_week, start_time, end_time, priority, created_at)
  VALUES ('44444444-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222',
          'Happy Hour','{0,1,2,3,4,5,6}','12:00','13:00',1, now() - interval '10 days');
INSERT INTO display_scheduled_screen_content (screen_id, schedule_id, media_asset_id)
  VALUES ('33333333-3333-3333-3333-333333333333','44444444-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000004');

-- Spans the Europe/London autumn DST transition (2026-10-25). Date-bounded to
-- October so it cannot cover the August cases above — which also exercises
-- date_start/date_end on a wrapped window, where the early-hours portion is
-- checked against the previous day's date.
INSERT INTO display_schedules (id, store_id, name, days_of_week, start_time, end_time, priority, date_start, date_end)
  VALUES ('44444444-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222',
          'DST Night','{6}','22:00','03:00',10,'2026-10-01','2026-10-31');
INSERT INTO display_scheduled_screen_content (screen_id, schedule_id, media_asset_id)
  VALUES ('33333333-3333-3333-3333-333333333333','44444444-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001');

-- ── Assertions ──────────────────────────────────────────────────────────────
-- 2026-08-07 is a Friday. Local times are BST (UTC+1) unless noted.
\pset format aligned
\pset border 2

WITH cases(label, at_utc, expected) AS (VALUES
  -- Overnight lifecycle
  ('Fri 20:00  before window',          timestamptz '2026-08-07 19:00Z','DEFAULT'),
  ('Fri 21:00  window opens',           timestamptz '2026-08-07 20:00Z','LATE-NIGHT'),
  ('Fri 23:59  still Friday',           timestamptz '2026-08-07 22:59Z','LATE-NIGHT'),
  ('Sat 00:30  past midnight',          timestamptz '2026-08-07 23:30Z','LATE-NIGHT'),
  ('Sat 01:59  final minute',           timestamptz '2026-08-08 00:59Z','LATE-NIGHT'),
  ('Sat 02:00  window closes',          timestamptz '2026-08-08 01:00Z','DEFAULT'),
  -- Day-of-week follows the day the window STARTS on
  ('Sat 21:00  Sat not selected',       timestamptz '2026-08-08 20:00Z','DEFAULT'),
  ('Sun 00:30  Sat never started',      timestamptz '2026-08-08 23:30Z','DEFAULT'),
  -- Same-day windows still behave
  ('Fri 11:30  lunch only',             timestamptz '2026-08-07 10:30Z','LUNCH'),
  ('Fri 14:00  lunch closes',           timestamptz '2026-08-07 13:00Z','DEFAULT'),
  -- Priority beats the created_at tiebreak
  ('Fri 12:30  overlap, higher wins',   timestamptz '2026-08-07 11:30Z','HAPPY-HOUR'),
  ('Fri 13:30  back to lunch',          timestamptz '2026-08-07 12:30Z','LUNCH'),
  -- DST fall-back: local 01:00-02:00 occurs twice on 2026-10-25
  ('Sat 23:00 BST  DST night opens',    timestamptz '2026-10-24 22:00Z','LATE-NIGHT'),
  ('Sun 01:30 BST  first pass',         timestamptz '2026-10-25 00:30Z','LATE-NIGHT'),
  ('Sun 01:30 GMT  repeated hour',      timestamptz '2026-10-25 01:30Z','LATE-NIGHT'),
  ('Sun 02:59 GMT  final minute',       timestamptz '2026-10-25 02:59Z','LATE-NIGHT'),
  ('Sun 03:00 GMT  window closes',      timestamptz '2026-10-25 03:00Z','DEFAULT')
)
SELECT label, expected, COALESCE(m.name,'DEFAULT') AS actual,
       CASE WHEN COALESCE(m.name,'DEFAULT') = expected THEN 'PASS' ELSE '*** FAIL ***' END AS result
FROM cases
CROSS JOIN LATERAL display_resolve_screen_content('33333333-3333-3333-3333-333333333333', at_utc) r
LEFT JOIN display_media_assets m ON m.id = r.resolved_media_id;

ROLLBACK;
