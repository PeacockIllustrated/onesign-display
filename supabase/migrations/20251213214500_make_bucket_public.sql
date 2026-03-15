-- Make the onesign-display bucket public
update storage.buckets
set public = true
where id = 'onesign-display';

-- Ensure it exists and is public (upsert)
insert into storage.buckets (id, name, public)
values ('onesign-display', 'onesign-display', true)
on conflict (id) do update
set public = true;

-- Remove the "avif/webp" restriction if it exists to allow generic images
-- (Optional, usually default allows all)
