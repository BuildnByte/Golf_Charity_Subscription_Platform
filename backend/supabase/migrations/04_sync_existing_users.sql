-- Sync any existing users from the authentication system into our public users table
-- This fixes the issue where an account was created *before* the automated trigger was set up.
insert into public.users (id, email, role)
select id, email, 'user'
from auth.users
where id not in (select id from public.users);
