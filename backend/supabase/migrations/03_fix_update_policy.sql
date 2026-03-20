-- Allow users to update their own profile (which allows them to set their selected_charity_id)
create policy "Users can update their own profile." on public.users for update using (auth.uid() = id);
