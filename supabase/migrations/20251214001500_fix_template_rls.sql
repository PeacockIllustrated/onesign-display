-- Fix RLS for specials_templates to allow Super Admins

drop policy if exists "Users can view templates for their client" on specials_templates;
drop policy if exists "Users can create templates for their client" on specials_templates;

-- Re-create policies with Super Admin bypass

-- SELECT: Users can view if it matches their client OR if they are super_admin
create policy "Users can view templates"
  on specials_templates for select
  using (
    (client_id in (select client_id from profiles where id = auth.uid()))
    or
    (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
  );

-- INSERT: Users can insert if it matches their client OR if they are super_admin
create policy "Users can create templates"
  on specials_templates for insert
  with check (
    (client_id in (select client_id from profiles where id = auth.uid()))
    or
    (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
  );

-- UPDATE: Users can update if it matches their client OR if they are super_admin
create policy "Users can update templates"
  on specials_templates for update
  using (
    (client_id in (select client_id from profiles where id = auth.uid()))
    or
    (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
  );

-- DELETE: Users can delete if it matches their client OR if they are super_admin
create policy "Users can delete templates"
  on specials_templates for delete
  using (
    (client_id in (select client_id from profiles where id = auth.uid()))
    or
    (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'))
  );
