-- ============================================================
-- Onesign Display — Master SQL Setup
-- Run this once against the SHARED Onesign Supabase project.
-- All tables prefixed with display_ to avoid collisions.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists moddatetime schema extensions;

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- Profiles (Users)
create table public.display_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('super_admin', 'client_admin')) not null,
  client_id uuid,
  name text,
  created_at timestamptz default now()
);

-- Clients
create table public.display_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- FK: display_profiles → display_clients
alter table public.display_profiles
add constraint fk_display_profiles_client
foreign key (client_id) references public.display_clients(id) on delete set null;

-- Stores
create table public.display_stores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.display_clients(id) on delete cascade not null,
  name text not null,
  timezone text default 'Europe/London',
  created_at timestamptz default now()
);

-- Screen Sets
create table public.display_screen_sets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.display_stores(id) on delete cascade not null,
  name text not null,
  layout_hint jsonb,
  created_at timestamptz default now()
);

-- Screens
create table public.display_screens (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.display_stores(id) on delete cascade not null,
  screen_set_id uuid references public.display_screen_sets(id) on delete set null,
  name text not null,
  index_in_set int,
  orientation text check (orientation in ('landscape','portrait')) not null,
  display_type text check (display_type in ('pc','android','firestick')) default 'pc',
  pairing_code text unique,
  player_token text unique,
  refresh_version bigint default 0,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

-- Media Assets
create table public.display_media_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.display_clients(id) on delete cascade not null,
  store_id uuid references public.display_stores(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete set null,
  filename text not null,
  storage_path text not null,
  mime text not null,
  width int,
  height int,
  bytes bigint,
  hash text,
  duration integer default 10,
  created_at timestamptz default now()
);

-- Screen Content (Active Assignment)
create table public.display_screen_content (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid references public.display_screens(id) on delete cascade not null,
  media_asset_id uuid references public.display_media_assets(id) on delete restrict not null,
  active boolean default true,
  assigned_at timestamptz default now()
);

create unique index idx_display_screen_content_active_unique
  on public.display_screen_content (screen_id) where (active = true);

-- Schedules
create table public.display_schedules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.display_stores(id) on delete cascade not null,
  name text not null,
  days_of_week int[] not null,
  start_time time not null,
  end_time time not null,
  date_start date,
  date_end date,
  priority int default 10,
  created_at timestamptz default now()
);

-- Scheduled Screen Content
create table public.display_scheduled_screen_content (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid references public.display_screens(id) on delete cascade not null,
  schedule_id uuid references public.display_schedules(id) on delete cascade not null,
  media_asset_id uuid references public.display_media_assets(id) on delete restrict not null,
  created_at timestamptz default now()
);

-- Audit Log
create table public.display_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  client_id uuid,
  store_id uuid,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. SPECIALS STUDIO TABLES
-- ============================================================

-- Specials Projects
create table public.display_specials_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.display_clients(id) on delete cascade not null,
  store_id uuid references public.display_stores(id) on delete set null,
  name text not null,
  canvas_preset text check (canvas_preset in ('landscape_1080', 'portrait_1080')) not null,
  design_json jsonb not null default '{}'::jsonb,
  last_published_media_asset_id uuid references public.display_media_assets(id) on delete set null,
  thumbnail_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger handle_display_specials_updated_at before update on public.display_specials_projects
  for each row execute procedure moddatetime (updated_at);

-- Specials Templates
create table if not exists public.display_specials_templates (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.display_clients(id) on delete cascade not null,
  name text not null,
  canvas_preset text not null,
  design_json jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 4. CLIENT PLANS
-- ============================================================

create table public.display_client_plans (
  client_id uuid primary key references public.display_clients(id) on delete cascade,
  plan_code text not null,
  status text not null default 'active' check (status in ('active', 'past_due', 'paused', 'cancelled')),
  max_screens int not null default 5,
  video_enabled boolean not null default false,
  specials_studio_enabled boolean not null default false,
  scheduling_enabled boolean not null default true,
  four_k_enabled boolean not null default false,
  design_package_included boolean not null default false,
  managed_design_support boolean not null default false,
  notes text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index display_client_plans_plan_code_idx on public.display_client_plans(plan_code);

-- ============================================================
-- 5. PROSPECTS (Demo Request Leads)
-- ============================================================

create table if not exists public.display_prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  plan text,
  screens text,
  message text,
  status text default 'new' check (status in ('new', 'contacted', 'demo_scheduled', 'converted', 'lost')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists display_prospects_status_idx on display_prospects(status);
create index if not exists display_prospects_created_at_idx on display_prospects(created_at desc);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table display_profiles enable row level security;
alter table display_clients enable row level security;
alter table display_stores enable row level security;
alter table display_screen_sets enable row level security;
alter table display_screens enable row level security;
alter table display_media_assets enable row level security;
alter table display_screen_content enable row level security;
alter table display_schedules enable row level security;
alter table display_scheduled_screen_content enable row level security;
alter table display_audit_log enable row level security;
alter table display_specials_projects enable row level security;
alter table display_specials_templates enable row level security;
alter table display_client_plans enable row level security;
alter table display_prospects enable row level security;

-- ============================================================
-- 7. HELPER FUNCTION
-- ============================================================

create or replace function public.display_get_user_role()
returns table (role text, client_id uuid)
security definer
as $$
begin
  return query select p.role, p.client_id from public.display_profiles p where p.id = auth.uid();
end;
$$ language plpgsql;

-- ============================================================
-- 8. RLS POLICIES — Core Tables
-- ============================================================

-- Profiles
create policy "display: View profiles" on display_profiles for select using (
  (select role from display_get_user_role()) = 'super_admin' or id = auth.uid()
);
create policy "display: Update profiles" on display_profiles for update using (
  (select role from display_get_user_role()) = 'super_admin'
);

-- Clients
create policy "display: View clients" on display_clients for select using (
  (select role from display_get_user_role()) = 'super_admin' or
  id = (select client_id from display_get_user_role())
);
create policy "display: Manage clients" on display_clients for all using (
  (select role from display_get_user_role()) = 'super_admin'
);

-- Stores
create policy "display: View stores" on display_stores for select using (
  (select role from display_get_user_role()) = 'super_admin' or
  client_id = (select client_id from display_get_user_role())
);
create policy "display: Manage stores" on display_stores for all using (
  (select role from display_get_user_role()) = 'super_admin' or
  client_id = (select client_id from display_get_user_role())
);

-- Screen Sets
create policy "display: View screen_sets" on display_screen_sets for select using (
  exists (select 1 from display_stores s where s.id = display_screen_sets.store_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);
create policy "display: Manage screen_sets" on display_screen_sets for all using (
  exists (select 1 from display_stores s where s.id = display_screen_sets.store_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);

-- Screens
create policy "display: View screens" on display_screens for select using (
  exists (select 1 from display_stores s where s.id = display_screens.store_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);
create policy "display: Manage screens" on display_screens for all using (
  exists (select 1 from display_stores s where s.id = display_screens.store_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);

-- Media Assets
create policy "display: View media" on display_media_assets for select using (
  client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
);
create policy "display: Manage media" on display_media_assets for all using (
  client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
);

-- Screen Content
create policy "display: View screen_content" on display_screen_content for select using (
  exists (select 1 from display_screens sc join display_stores s on sc.store_id = s.id where sc.id = display_screen_content.screen_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);
create policy "display: Manage screen_content" on display_screen_content for all using (
  exists (select 1 from display_screens sc join display_stores s on sc.store_id = s.id where sc.id = display_screen_content.screen_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);

-- Schedules
create policy "display: View schedules" on display_schedules for select using (
  exists (select 1 from display_stores s where s.id = display_schedules.store_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);
create policy "display: Manage schedules" on display_schedules for all using (
  exists (select 1 from display_stores s where s.id = display_schedules.store_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);

-- Scheduled Screen Content
create policy "display: View sche_content" on display_scheduled_screen_content for select using (
  exists (select 1 from display_screens sc join display_stores s on sc.store_id = s.id where sc.id = display_scheduled_screen_content.screen_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);
create policy "display: Manage sche_content" on display_scheduled_screen_content for all using (
  exists (select 1 from display_screens sc join display_stores s on sc.store_id = s.id where sc.id = display_scheduled_screen_content.screen_id and (
    s.client_id = (select client_id from display_get_user_role()) or (select role from display_get_user_role()) = 'super_admin'
  ))
);

-- ============================================================
-- 9. RLS POLICIES — Specials Projects
-- ============================================================

create policy "display: View specials_projects" on display_specials_projects for select using (
  (select role from display_get_user_role()) = 'super_admin' or
  client_id = (select client_id from display_get_user_role())
);
create policy "display: Manage specials_projects" on display_specials_projects for all using (
  (select role from display_get_user_role()) = 'super_admin' or
  client_id = (select client_id from display_get_user_role())
);

-- ============================================================
-- 10. RLS POLICIES — Specials Templates
-- ============================================================

create policy "display: View templates" on display_specials_templates for select using (
  (client_id in (select client_id from display_profiles where id = auth.uid()))
  or (exists (select 1 from display_profiles where id = auth.uid() and role = 'super_admin'))
);
create policy "display: Create templates" on display_specials_templates for insert with check (
  (client_id in (select client_id from display_profiles where id = auth.uid()))
  or (exists (select 1 from display_profiles where id = auth.uid() and role = 'super_admin'))
);
create policy "display: Update templates" on display_specials_templates for update using (
  (client_id in (select client_id from display_profiles where id = auth.uid()))
  or (exists (select 1 from display_profiles where id = auth.uid() and role = 'super_admin'))
);
create policy "display: Delete templates" on display_specials_templates for delete using (
  (client_id in (select client_id from display_profiles where id = auth.uid()))
  or (exists (select 1 from display_profiles where id = auth.uid() and role = 'super_admin'))
);

-- ============================================================
-- 11. RLS POLICIES — Client Plans
-- ============================================================

create policy "display: Super Admin full access on client_plans" on public.display_client_plans
  for all to authenticated using (
    exists (select 1 from public.display_profiles where display_profiles.id = auth.uid() and display_profiles.role = 'super_admin')
  );

create policy "display: Client Admin view own plan" on public.display_client_plans
  for select to authenticated using (
    client_id in (select client_id from public.display_profiles where display_profiles.id = auth.uid())
  );

-- ============================================================
-- 12. RLS POLICIES — Prospects
-- ============================================================

create policy "display: Super admins manage prospects" on display_prospects
  for all to authenticated using (
    exists (select 1 from display_profiles where display_profiles.id = auth.uid() and display_profiles.role = 'super_admin')
  );

create policy "display: Anyone can submit prospects" on display_prospects
  for insert to anon, authenticated with check (true);

-- ============================================================
-- 13. PLAYER RESOLUTION FUNCTION
-- ============================================================

create or replace function display_resolve_screen_media(p_screen_id uuid, p_now timestamptz)
returns uuid
language plpgsql
security definer
as $$
declare
  v_media_id uuid;
  v_time time;
  v_date date;
  v_dow int;
begin
  v_time := p_now::time;
  v_date := p_now::date;
  v_dow := extract(dow from p_now)::int;

  -- 1. Check Schedules (highest priority first)
  select ssc.media_asset_id
  into v_media_id
  from display_scheduled_screen_content ssc
  join display_schedules s on ssc.schedule_id = s.id
  where ssc.screen_id = p_screen_id
    and v_dow = any(s.days_of_week)
    and v_time between s.start_time and s.end_time
    and (s.date_start is null or s.date_start <= v_date)
    and (s.date_end is null or s.date_end >= v_date)
  order by s.priority asc, s.created_at desc
  limit 1;

  if v_media_id is not null then
    return v_media_id;
  end if;

  -- 2. Fallback to Active Content
  select media_asset_id
  into v_media_id
  from display_screen_content
  where screen_id = p_screen_id and active = true
  limit 1;

  return v_media_id;
end;
$$;

-- ============================================================
-- 14. STORAGE BUCKET
-- ============================================================

-- Create the public bucket
insert into storage.buckets (id, name, public)
values ('onesign-display', 'onesign-display', true)
on conflict (id) do update set public = true;

-- Storage RLS policies
create policy "Authenticated users can upload to onesign-display"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'onesign-display' );

create policy "Authenticated users can update onesign-display"
  on storage.objects for update to authenticated
  using ( bucket_id = 'onesign-display' );

create policy "Authenticated users can delete from onesign-display"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'onesign-display' );

create policy "Anyone can read onesign-display"
  on storage.objects for select to public
  using ( bucket_id = 'onesign-display' );

-- ============================================================
-- 15. SEED DATA (Optional — remove if not needed)
-- ============================================================

-- Demo Client
INSERT INTO public.display_clients (id, name, slug)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onesign Demo Client', 'onesign-demo')
ON CONFLICT DO NOTHING;

-- Demo Store
INSERT INTO public.display_stores (id, client_id, name)
VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'HQ Flagship')
ON CONFLICT DO NOTHING;

-- Demo Screen Set
INSERT INTO public.display_screen_sets (id, store_id, name)
VALUES ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Lobby Menu Board')
ON CONFLICT DO NOTHING;

-- Demo Screens
INSERT INTO public.display_screens (id, store_id, screen_set_id, name, index_in_set, orientation, display_type, pairing_code, player_token)
VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 1 (Left)', 1, 'landscape', 'pc', '111111', 'token-screen-1'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 2', 2, 'landscape', 'pc', '222222', 'token-screen-2'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 3', 3, 'landscape', 'android', '333333', 'token-screen-3'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d47', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 4 (Right)', 4, 'landscape', 'firestick', '444444', 'token-screen-4'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d48', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Promo Vertical', 1, 'portrait', 'pc', '555555', 'token-screen-5')
ON CONFLICT DO NOTHING;

-- Backfill client plans for seed client
INSERT INTO public.display_client_plans (
  client_id, plan_code, status, max_screens, video_enabled,
  specials_studio_enabled, scheduling_enabled, four_k_enabled,
  design_package_included, managed_design_support
)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'video_design_system', 'active', 5, true,
  true, true, false, true, false
)
ON CONFLICT (client_id) DO NOTHING;

-- ============================================================
-- Done. Now create your super_admin user via Supabase Auth,
-- then insert a row into display_profiles:
--
--   INSERT INTO display_profiles (id, role, client_id)
--   VALUES ('<your-auth-user-uuid>', 'super_admin', NULL);
-- ============================================================
