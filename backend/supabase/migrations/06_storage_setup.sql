-- Creates a public bucket for winner verification screenshots
insert into storage.buckets (id, name, public) values ('verification', 'verification', true) on conflict do nothing;

create policy "Anyone can upload a screenshot." on storage.objects for insert with check ( bucket_id = 'verification' );
create policy "Anyone can view screenshots." on storage.objects for select using ( bucket_id = 'verification' );
