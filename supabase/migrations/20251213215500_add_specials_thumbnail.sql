alter table public.specials_projects
add column thumbnail_url text;

-- Policy to allow update of course is already there via "Manage specials_projects"
