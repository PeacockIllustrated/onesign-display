-- ============================================================
-- Onesign Display — Master SQL Setup
-- Run this once against a fresh Supabase project.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists moddatetime schema extensions;

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- Profiles (Users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('super_admin', 'client_admin')) not null,
  client_id uuid,
  name text,
  created_at timestamptz default now()
);

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- FK: profiles → clients
alter table public.profiles
add constraint fk_profiles_client
foreign key (client_id) references public.clients(id) on delete set null;

-- Stores
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  timezone text default 'Europe/London',
  created_at timestamptz default now()
);

-- Screen Sets
create table public.screen_sets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  layout_hint jsonb,
  created_at timestamptz default now()
);

-- Screens
create table public.screens (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  screen_set_id uuid references public.screen_sets(id) on delete set null,
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
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade,
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
create table public.screen_content (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid references public.screens(id) on delete cascade not null,
  media_asset_id uuid references public.media_assets(id) on delete restrict not null,
  active boolean default true,
  assigned_at timestamptz default now()
);

create unique index idx_screen_content_active_unique
  on public.screen_content (screen_id) where (active = true);

-- Schedules
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
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
create table public.scheduled_screen_content (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid references public.screens(id) on delete cascade not null,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  media_asset_id uuid references public.media_assets(id) on delete restrict not null,
  created_at timestamptz default now()
);

-- Audit Log
create table public.audit_log (
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
create table public.specials_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete set null,
  name text not null,
  canvas_preset text check (canvas_preset in ('landscape_1080', 'portrait_1080')) not null,
  design_json jsonb not null default '{}'::jsonb,
  last_published_media_asset_id uuid references public.media_assets(id) on delete set null,
  thumbnail_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger handle_specials_updated_at before update on public.specials_projects
  for each row execute procedure moddatetime (updated_at);

-- Specials Templates
create table if not exists public.specials_templates (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
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

create table public.client_plans (
  client_id uuid primary key references public.clients(id) on delete cascade,
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

create index client_plans_plan_code_idx on public.client_plans(plan_code);

-- ============================================================
-- 5. PROSPECTS (Demo Request Leads)
-- ============================================================

create table if not exists public.prospects (
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

create index if not exists prospects_status_idx on prospects(status);
create index if not exists prospects_created_at_idx on prospects(created_at desc);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table clients enable row level security;
alter table stores enable row level security;
alter table screen_sets enable row level security;
alter table screens enable row level security;
alter table media_assets enable row level security;
alter table screen_content enable row level security;
alter table schedules enable row level security;
alter table scheduled_screen_content enable row level security;
alter table audit_log enable row level security;
alter table specials_projects enable row level security;
alter table specials_templates enable row level security;
alter table client_plans enable row level security;
alter table prospects enable row level security;

-- ============================================================
-- 7. HELPER FUNCTION
-- ============================================================

create or replace function public.get_user_role()
returns table (role text, client_id uuid)
security definer
as $$
begin
  return query select p.role, p.client_id from public.profiles p where p.id = auth.uid();
end;
$$ language plpgsql;

-- ============================================================
-- 8. RLS POLICIES — Core Tables
-- ============================================================

-- Profiles
create policy "View profiles" on profiles for select using (
  (select role from get_user_role()) = 'super_admin' or id = auth.uid()
);
create policy "Update profiles" on profiles for update using (
  (select role from get_user_role()) = 'super_admin'
);

-- Clients
create policy "View clients" on clients for select using (
  (select role from get_user_role()) = 'super_admin' or
  id = (select client_id from get_user_role())
);
create policy "Manage clients" on clients for all using (
  (select role from get_user_role()) = 'super_admin'
);

-- Stores
create policy "View stores" on stores for select using (
  (select role from get_user_role()) = 'super_admin' or
  client_id = (select client_id from get_user_role())
);
create policy "Manage stores" on stores for all using (
  (select role from get_user_role()) = 'super_admin' or
  client_id = (select client_id from get_user_role())
);

-- Screen Sets
create policy "View screen_sets" on screen_sets for select using (
  exists (select 1 from stores s where s.id = screen_sets.store_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);
create policy "Manage screen_sets" on screen_sets for all using (
  exists (select 1 from stores s where s.id = screen_sets.store_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);

-- Screens
create policy "View screens" on screens for select using (
  exists (select 1 from stores s where s.id = screens.store_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);
create policy "Manage screens" on screens for all using (
  exists (select 1 from stores s where s.id = screens.store_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);

-- Media Assets
create policy "View media" on media_assets for select using (
  client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
);
create policy "Manage media" on media_assets for all using (
  client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
);

-- Screen Content
create policy "View screen_content" on screen_content for select using (
  exists (select 1 from screens sc join stores s on sc.store_id = s.id where sc.id = screen_content.screen_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);
create policy "Manage screen_content" on screen_content for all using (
  exists (select 1 from screens sc join stores s on sc.store_id = s.id where sc.id = screen_content.screen_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);

-- Schedules
create policy "View schedules" on schedules for select using (
  exists (select 1 from stores s where s.id = schedules.store_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);
create policy "Manage schedules" on schedules for all using (
  exists (select 1 from stores s where s.id = schedules.store_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);

-- Scheduled Screen Content
create policy "View sche_content" on scheduled_screen_content for select using (
  exists (select 1 from screens sc join stores s on sc.store_id = s.id where sc.id = scheduled_screen_content.screen_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);
create policy "Manage sche_content" on scheduled_screen_content for all using (
  exists (select 1 from screens sc join stores s on sc.store_id = s.id where sc.id = scheduled_screen_content.screen_id and (
    s.client_id = (select client_id from get_user_role()) or (select role from get_user_role()) = 'super_admin'
  ))
);

-- ============================================================
-- 9. RLS POLICIES — Specials Projects
-- ============================================================

create policy "View specials_projects" on specials_projects for select using (
  (select role from get_user_role()) = 'super_admin' or
  client_id = (select client_id from get_user_role())
);
create policy "Manage specials_projects" on specials_projects for all using (
  (select role from get_user_role()) = 'super_admin' or
  client_id = (select client_id from get_user_role())
);

-- ============================================================
-- 10. RLS POLICIES — Specials Templates
-- ============================================================

create policy "Users can view templates" on specials_templates for select using (
  (client_id in (select client_id from profiles where id = auth.uid()))
  or (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
);
create policy "Users can create templates" on specials_templates for insert with check (
  (client_id in (select client_id from profiles where id = auth.uid()))
  or (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
);
create policy "Users can update templates" on specials_templates for update using (
  (client_id in (select client_id from profiles where id = auth.uid()))
  or (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
);
create policy "Users can delete templates" on specials_templates for delete using (
  (client_id in (select client_id from profiles where id = auth.uid()))
  or (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
);

-- ============================================================
-- 11. RLS POLICIES — Client Plans
-- ============================================================

create policy "Super Admin can do everything on client_plans" on public.client_plans
  for all to authenticated using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin')
  );

create policy "Client Admin can view their own plan" on public.client_plans
  for select to authenticated using (
    client_id in (select client_id from public.profiles where profiles.id = auth.uid())
  );

-- ============================================================
-- 12. RLS POLICIES — Prospects
-- ============================================================

create policy "Super admins can manage prospects" on prospects
  for all to authenticated using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'super_admin')
  );

create policy "Anyone can submit prospects" on prospects
  for insert to anon, authenticated with check (true);

-- ============================================================
-- 13. PLAYER RESOLUTION FUNCTION
-- ============================================================

create or replace function resolve_screen_media(p_screen_id uuid, p_now timestamptz)
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
  from scheduled_screen_content ssc
  join schedules s on ssc.schedule_id = s.id
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
  from screen_content
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
INSERT INTO public.clients (id, name, slug)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onesign Demo Client', 'onesign-demo')
ON CONFLICT DO NOTHING;

-- Demo Store
INSERT INTO public.stores (id, client_id, name)
VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'HQ Flagship')
ON CONFLICT DO NOTHING;

-- Demo Screen Set
INSERT INTO public.screen_sets (id, store_id, name)
VALUES ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Lobby Menu Board')
ON CONFLICT DO NOTHING;

-- Demo Screens
INSERT INTO public.screens (id, store_id, screen_set_id, name, index_in_set, orientation, display_type, pairing_code, player_token)
VALUES
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 1 (Left)', 1, 'landscape', 'pc', '111111', 'token-screen-1'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 2', 2, 'landscape', 'pc', '222222', 'token-screen-2'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 3', 3, 'landscape', 'android', '333333', 'token-screen-3'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d47', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 4 (Right)', 4, 'landscape', 'firestick', '444444', 'token-screen-4'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d48', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Promo Vertical', 1, 'portrait', 'pc', '555555', 'token-screen-5')
ON CONFLICT DO NOTHING;

-- Backfill client plans for seed client
INSERT INTO public.client_plans (
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
-- then insert a row into profiles:
--
--   INSERT INTO profiles (id, role, client_id)
--   VALUES ('<your-auth-user-uuid>', 'super_admin', NULL);
-- ============================================================
