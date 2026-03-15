-- Supabase Storage Policies
-- Warning: If 'ALTER TABLE' failed, RLS is likely already enabled or managed by Supabase.
-- We will skip enabling RLS and just attempt to add the policies.

-- HELPER: We assume file structure is: `client_id/filename.ext`
-- OR we allow access if the user is super_admin.

-- 1. Allow View (Select)
create policy "View Media" on storage.objects for select using (
  bucket_id = 'onesign-display' 
  and (
    (select role from public.get_user_role()) = 'super_admin'
    or 
    (storage.foldername(name))[1]::uuid = (select client_id from public.get_user_role())
  )
);

-- 2. Allow Upload (Insert)
create policy "Upload Media" on storage.objects for insert with check (
  bucket_id = 'onesign-display' 
  and (
    (select role from public.get_user_role()) = 'super_admin'
    or 
    (storage.foldername(name))[1]::uuid = (select client_id from public.get_user_role())
  )
);

-- 3. Allow Update (Optional, for overwrites)
create policy "Update Media" on storage.objects for update using (
  bucket_id = 'onesign-display' 
  and (
    (select role from public.get_user_role()) = 'super_admin'
    or 
    (storage.foldername(name))[1]::uuid = (select client_id from public.get_user_role())
  )
);

-- 4. Allow Delete
create policy "Delete Media" on storage.objects for delete using (
  bucket_id = 'onesign-display' 
  and (
    (select role from public.get_user_role()) = 'super_admin'
    or 
    (storage.foldername(name))[1]::uuid = (select client_id from public.get_user_role())
  )
);
