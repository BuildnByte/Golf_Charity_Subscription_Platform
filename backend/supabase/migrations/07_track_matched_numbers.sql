-- 1. Fix the permissions for Storage that prevent anonymous/authenticated uploading
drop policy if exists "Anyone can upload a screenshot." on storage.objects;
drop policy if exists "Anyone can view screenshots." on storage.objects;
drop policy if exists "Anyone can update a screenshot." on storage.objects;

create policy "Anyone can upload a screenshot." on storage.objects for insert to public with check (bucket_id = 'verification');
create policy "Anyone can update a screenshot." on storage.objects for update to public using (bucket_id = 'verification');
create policy "Anyone can view screenshots." on storage.objects for select to public using (bucket_id = 'verification');

-- 2. Add column to track exactly which numbers matched
alter table public.winners add column if not exists matched_numbers integer[] default '{}';
