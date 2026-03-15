-- Create client_plans table
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

-- Add index
create index client_plans_plan_code_idx on public.client_plans(plan_code);

-- Enable RLS
alter table public.client_plans enable row level security;

-- Policies

-- Super Admin: Full access
create policy "Super Admin can do everything on client_plans"
  on public.client_plans
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

-- Client Admin: Read only for their own client
create policy "Client Admin can view their own plan"
  on public.client_plans
  for select
  to authenticated
  using (
    client_id in (
      select client_id from public.profiles
      where profiles.id = auth.uid()
    )
  );

-- Backfill existing clients
insert into public.client_plans (
  client_id, 
  plan_code, 
  status, 
  max_screens, 
  video_enabled, 
  specials_studio_enabled, 
  scheduling_enabled, 
  four_k_enabled, 
  design_package_included, 
  managed_design_support
)
select 
  id as client_id,
  'video_design_system' as plan_code,
  'active' as status,
  5 as max_screens,
  true as video_enabled,
  true as specials_studio_enabled,
  true as scheduling_enabled,
  false as four_k_enabled,
  true as design_package_included,
  false as managed_design_support
from public.clients
on conflict (client_id) do nothing;
