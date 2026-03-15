alter table public.media_assets
add column if not exists duration integer default 10;
