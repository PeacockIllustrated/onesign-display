-- Enable RLS on all tables
-- (Will be done after table creation)

-- 1. Profiles (Users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('super_admin', 'client_admin')) not null,
  client_id uuid, -- null for super_admin
  name text,
  created_at timestamptz default now()
);

-- 2. Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Add logic to link profiles to clients
alter table public.profiles 
add constraint fk_profiles_client 
foreign key (client_id) references public.clients(id) on delete set null;

-- 3. Stores
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  timezone text default 'Europe/London',
  created_at timestamptz default now()
);

-- 4. Screen Sets
create table public.screen_sets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  layout_hint jsonb, -- e.g. order + labels
  created_at timestamptz default now()
);

-- 5. Screens
create table public.screens (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  screen_set_id uuid references public.screen_sets(id) on delete set null,
  name text not null,
  index_in_set int, -- 1..n
  orientation text check (orientation in ('landscape','portrait')) not null,
  display_type text check (display_type in ('pc','android','firestick')) default 'pc',
  pairing_code text unique, -- short code
  player_token text unique, -- long random token
  refresh_version bigint default 0,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

-- 6. Media Assets
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
  created_at timestamptz default now()
);

-- 7. Screen Content (Active Assignment)
create table public.screen_content (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid references public.screens(id) on delete cascade not null,
  media_asset_id uuid references public.media_assets(id) on delete restrict not null,
  active boolean default true,
  assigned_at timestamptz default now()
);

create unique index idx_screen_content_active_unique on public.screen_content (screen_id) where (active = true);

-- 8. Schedules
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  days_of_week int[] not null, -- 0=Sun..6=Sat
  start_time time not null,
  end_time time not null,
  date_start date,
  date_end date,
  priority int default 10,
  created_at timestamptz default now()
);

-- 9. Scheduled Screen Content
create table public.scheduled_screen_content (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid references public.screens(id) on delete cascade not null,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  media_asset_id uuid references public.media_assets(id) on delete restrict not null,
  created_at timestamptz default now()
);

-- 10. Audit Log
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


-- RLS Policies
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

-- Function to get current user role and client_id
create or replace function public.get_user_role()
returns table (role text, client_id uuid) 
security definer
as $$
begin
  return query select p.role, p.client_id from public.profiles p where p.id = auth.uid();
end;
$$ language plpgsql;

-- Admin Policy Logic
-- Super Admin: true for all
-- Client Admin: client_id matches or linked table matches client_id

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
  client_id = (select client_id from get_user_role()) -- Client admin can manage their stores
);

-- Screen Sets, Screens, Media Assets, Schedules
-- (Common pattern: check store -> client)

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

-- Player Resolution Function
create or replace function resolve_screen_media(p_screen_id uuid, p_now timestamptz)
returns uuid -- returns media_asset_id
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

  -- 1. Check Schedules
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
