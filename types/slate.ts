import { z } from 'zod';

export const UserRoleSchema = z.enum(['super_admin', 'client_admin']);

export const ClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  created_at: z.string(),
});

export const StoreSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  name: z.string().min(1),
  timezone: z.string().default('Europe/London'),
  created_at: z.string(),
});

export const ScreenSetSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  name: z.string().min(1),
  layout_hint: z.record(z.string(), z.any()).optional().nullable(),
  created_at: z.string(),
});

export const ScreenSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  screen_set_id: z.string().uuid().nullable(),
  name: z.string().min(1),
  index_in_set: z.number().int().min(1),
  orientation: z.enum(['landscape', 'portrait']),
  display_type: z.enum(['pc', 'android', 'firestick']),
  pairing_code: z.string().nullable(),
  player_token: z.string().nullable(),
  refresh_version: z.number(),
  last_seen_at: z.string().nullable(),
  created_at: z.string(),
});

export const MediaAssetSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  store_id: z.string().uuid().nullable(),
  filename: z.string(),
  storage_path: z.string(),
  mime: z.string(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  bytes: z.number().optional().nullable(),
  created_at: z.string(),
});

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  name: z.string().min(1),
  days_of_week: z.array(z.number().min(0).max(6)),
  start_time: z.string(), // "HH:MM:SS"
  end_time: z.string(),
  date_start: z.string().nullable(),
  date_end: z.string().nullable(),
  priority: z.number(),
  created_at: z.string(),
});
