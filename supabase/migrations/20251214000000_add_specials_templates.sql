create table if not exists specials_templates (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  name text not null,
  canvas_preset text not null,
  design_json jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table specials_templates enable row level security;

create policy "Users can view templates for their client"
  on specials_templates for select
  using (
    client_id in (
      select client_id from profiles
      where id = auth.uid()
    )
  );

create policy "Users can create templates for their client"
  on specials_templates for insert
  with check (
    client_id in (
      select client_id from profiles
      where id = auth.uid()
    )
  );

-- Super admins/Admins logic might be needed if strictly enforcing, but for now client check is good.
-- Assuming profiles.client_id is the main enforcement mechanism.

-- Add Storage bucket policy improvements if needed, but existing should cover if in same bucket.
