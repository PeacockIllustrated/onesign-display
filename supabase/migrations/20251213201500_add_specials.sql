-- Create specials_projects table
create table public.specials_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete set null, -- Nullable for templates/cross-store
  name text not null,
  canvas_preset text check (canvas_preset in ('landscape_1080', 'portrait_1080')) not null,
  design_json jsonb not null default '{}'::jsonb,
  last_published_media_asset_id uuid references public.media_assets(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.specials_projects enable row level security;

-- Policies
-- View: Super Admin or Client Admin (matching client_id)
create policy "View specials_projects" on specials_projects for select using (
  (select role from get_user_role()) = 'super_admin' or 
  client_id = (select client_id from get_user_role())
);

-- Manage: Super Admin or Client Admin (matching client_id)
create policy "Manage specials_projects" on specials_projects for all using (
  (select role from get_user_role()) = 'super_admin' or 
  client_id = (select client_id from get_user_role())
);

-- Trigger for updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.specials_projects
  for each row execute procedure moddatetime (updated_at);
