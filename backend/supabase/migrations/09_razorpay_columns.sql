-- Add specific columns for Razorpay transaction tracking
alter table public.subscriptions add column if not exists razorpay_order_id text;
alter table public.subscriptions add column if not exists razorpay_payment_id text;

-- Allow users to insert/update their own subscription records when they successfully pay
create policy "Users can insert their own subscriptions." on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update their own subscriptions." on public.subscriptions for update using (auth.uid() = user_id);

-- Add an ON CONFLICT constraint by creating a unique index on user_id if it doesn't have one
drop index if exists subscriptions_user_id_idx;
create unique index if not exists subscriptions_user_id_unique_idx on public.subscriptions (user_id);
