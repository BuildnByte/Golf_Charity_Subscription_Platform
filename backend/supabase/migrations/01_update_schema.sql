-- Phase 3 Schema Update

-- 1. Add selected_charity_id to users table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='users' and column_name='selected_charity_id') then
    alter table public.users add column selected_charity_id uuid references public.charities(id);
  end if;
end $$;

-- 2. Seed minimum 4 charities for selection
insert into public.charities (name, description) values
('Global Education Fund', 'Providing educational resources to underprivileged children worldwide.'),
('Ocean Clean Initiative', 'Removing plastics and pollutants from our oceans.'),
('Wildlife Preservation Trust', 'Protecting endangered species and their natural habitats.'),
('Health For All', 'Funding medical research and providing healthcare access in developing areas.')
on conflict do nothing;
