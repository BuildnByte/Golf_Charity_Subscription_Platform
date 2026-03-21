-- Phase 7: RLS and Sign-Up Fixes
-- Enable authorized Administrators to manually patch User data 

create policy "Admins can update users" on public.users for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Re-assign the user mapping trigger to naturally pull full_name and default charities
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role, full_name, charity_percentage)
  values (
    new.id, 
    new.email, 
    'user', 
    new.raw_user_meta_data->>'full_name',
    10 -- default split logically applied on setup
  );
  return new;
end;
$$;
