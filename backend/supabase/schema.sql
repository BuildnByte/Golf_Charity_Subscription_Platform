-- Schema Definition for Interview Project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.users enable row level security;
create policy "Users can view their own profile." on public.users for select using (auth.uid() = id);
create policy "Admins can view all profiles." on public.users for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Trigger to automatically create user profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Subscriptions Table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  status text not null,
  stripe_sub_id text,
  plan_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;
create policy "Users can view their own subscriptions." on public.subscriptions for select using (auth.uid() = user_id);
-- Admins can view/edit all
create policy "Admins can manage subscriptions" on public.subscriptions for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 3. Scores Table
create table public.scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  score integer not null check (score >= 1 and score <= 45),
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.scores enable row level security;
create policy "Users can view their own scores." on public.scores for select using (auth.uid() = user_id);
create policy "Users can insert their own scores." on public.scores for insert with check (auth.uid() = user_id);
create policy "Users can delete their own scores." on public.scores for delete using (auth.uid() = user_id);
create policy "Admins can manage scores." on public.scores for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 4. Draws Table
create table public.draws (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  numbers integer[] check (array_length(numbers, 1) = 5),
  status text not null default 'pending' check (status in ('pending', 'drawn')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.draws enable row level security;
create policy "Anyone can view draws." on public.draws for select using (true);
create policy "Admins can manage draws." on public.draws for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 5. Charities Table
create table public.charities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  amount_raised numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.charities enable row level security;
create policy "Anyone can view charities." on public.charities for select using (true);
create policy "Admins can manage charities." on public.charities for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 6. Winners Table
create table public.winners (
  id uuid default uuid_generate_v4() primary key,
  draw_id uuid references public.draws(id) not null,
  user_id uuid references public.users(id) not null,
  match_count integer not null check (match_count between 3 and 5),
  prize_amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  screenshot_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.winners enable row level security;
create policy "Users can view their own wins." on public.winners for select using (auth.uid() = user_id);
create policy "Users can update their own wins (e.g., upload screenshot)." on public.winners for update using (auth.uid() = user_id);
create policy "Admins can manage winners." on public.winners for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
