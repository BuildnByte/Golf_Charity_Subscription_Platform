-- 1. Fix infinite recursion in RLS policies by using a SECURITY DEFINER function
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop all old admin policies
drop policy if exists "Admins can view all profiles." on public.users;
drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
drop policy if exists "Admins can manage scores." on public.scores;
drop policy if exists "Admins can manage draws." on public.draws;
drop policy if exists "Admins can manage charities." on public.charities;
drop policy if exists "Admins can manage winners." on public.winners;

-- Recreate policies using the secure function to prevent infinite loops
create policy "Admins can view all profiles." on public.users for select using (public.is_admin());
create policy "Admins can manage subscriptions" on public.subscriptions for all using (public.is_admin());
create policy "Admins can manage scores." on public.scores for all using (public.is_admin());
create policy "Admins can manage draws." on public.draws for all using (public.is_admin());
create policy "Admins can manage charities." on public.charities for all using (public.is_admin());
create policy "Admins can manage winners." on public.winners for all using (public.is_admin());

-- 2. Insert Charities
-- (The previous script failed because ON CONFLICT DO NOTHING requires a unique constraint)
insert into public.charities (name, description) values
('Global Education Fund', 'Providing educational resources to underprivileged children worldwide.'),
('Ocean Clean Initiative', 'Removing plastics and pollutants from our oceans.'),
('Wildlife Preservation Trust', 'Protecting endangered species and their natural habitats.'),
('Health For All', 'Funding medical research and providing healthcare access in developing areas.');
