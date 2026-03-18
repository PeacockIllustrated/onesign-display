-- Performance indexes for frequently queried foreign key columns
-- All use IF NOT EXISTS — safe to run multiple times

CREATE INDEX IF NOT EXISTS idx_display_media_assets_client_id
  ON display_media_assets(client_id);

CREATE INDEX IF NOT EXISTS idx_display_media_assets_store_id
  ON display_media_assets(store_id);

CREATE INDEX IF NOT EXISTS idx_display_schedules_store_id
  ON display_schedules(store_id);

CREATE INDEX IF NOT EXISTS idx_display_scheduled_content_schedule
  ON display_scheduled_screen_content(schedule_id);

CREATE INDEX IF NOT EXISTS idx_display_scheduled_content_screen
  ON display_scheduled_screen_content(screen_id);
