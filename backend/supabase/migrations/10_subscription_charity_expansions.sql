-- Track expiration date for subscriptions securely
alter table public.subscriptions add column if not exists current_period_end timestamp with time zone;

-- Track custom charity allocation logic (default 10%)
alter table public.users add column if not exists charity_percentage integer default 10;
alter table public.users add constraint chk_charity_percentage check (charity_percentage >= 10 and charity_percentage <= 100);

-- Expand Charity directory displays for frontend mapping
alter table public.charities add column if not exists image_url text;
alter table public.charities add column if not exists upcoming_events jsonb default '[]'::jsonb;
alter table public.charities add column if not exists is_featured boolean default false;

-- Create direct Independent Donations tracking
create table if not exists public.donations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  charity_id uuid references public.charities(id),
  amount numeric not null check(amount > 0),
  status text check(status in ('successful', 'failed', 'pending')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS and setup standard transactional policies
alter table public.donations enable row level security;
create policy "Users can view their donations." on public.donations for select using (auth.uid() = user_id);
create policy "Users can insert their donations." on public.donations for insert with check (auth.uid() = user_id);
create policy "Admins view all donations" on public.donations for all using (public.is_admin());

-- Modify the charity seed to add some stunning generic imagery data and parsed events
update public.charities
set image_url = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    upcoming_events = '[{"title": "Annual Charity Gala", "date": "2026-05-15"}, {"title": "Community Outreach", "date": "2026-06-20"}]'::jsonb,
    is_featured = true
where name = 'Global Education Fund';

update public.charities
set image_url = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&q=80&w=800',
    upcoming_events = '[{"title": "Summer Field Day", "date": "2026-07-10"}, {"title": "Winter Shelter Drive", "date": "2026-11-20"}]'::jsonb,
    is_featured = false
where name != 'Global Education Fund';
