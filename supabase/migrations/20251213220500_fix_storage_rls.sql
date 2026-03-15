-- Ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('onesign-display', 'onesign-display', true)
on conflict (id) do update set public = true;

-- Drop existing policies to avoid conflicts (permissive cleanup)
drop policy if exists "Authenticated users can upload to onesign-display" on storage.objects;
drop policy if exists "Authenticated users can update onesign-display" on storage.objects;
drop policy if exists "Authenticated users can delete from onesign-display" on storage.objects;
drop policy if exists "Anyone can read onesign-display" on storage.objects;

-- Create policies
create policy "Authenticated users can upload to onesign-display"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'onesign-display' );

create policy "Authenticated users can update onesign-display"
on storage.objects for update
to authenticated
using ( bucket_id = 'onesign-display' );

create policy "Authenticated users can delete from onesign-display"
on storage.objects for delete
to authenticated
using ( bucket_id = 'onesign-display' );

-- Public read access
create policy "Anyone can read onesign-display"
on storage.objects for select
to public
using ( bucket_id = 'onesign-display' );
