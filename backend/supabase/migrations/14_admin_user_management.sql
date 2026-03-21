-- Phase 7: Admin User Management Extensions

-- Track when scores are modified manually by an Admin to preserve draw integrity
alter table public.scores add column if not exists admin_edited_at timestamp with time zone;

-- Add a full_name attribute to explicitly manage user names natively
alter table public.users add column if not exists full_name text;
