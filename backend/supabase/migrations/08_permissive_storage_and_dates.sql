-- 1. Add matched details string array which will hold values like "42 (2025-03-20)"
alter table public.winners add column if not exists matched_details text[] default '{}';

-- 2. Drop strict storage policies that are causing anonymous upload errors
drop policy if exists "Anyone can upload a screenshot." on storage.objects;
drop policy if exists "Anyone can update a screenshot." on storage.objects;
drop policy if exists "Anyone can view screenshots." on storage.objects;

-- 3. In a development environment without RLS proxy pass-through, we can use a highly permissive policy 
-- for the public verification bucket specifically.
create policy "Permissive public access for verification bucket"
on storage.objects for all
to public
using ( bucket_id = 'verification' )
with check ( bucket_id = 'verification' );
