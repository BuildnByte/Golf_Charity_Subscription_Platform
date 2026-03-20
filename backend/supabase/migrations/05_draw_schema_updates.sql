-- Add total prize pool and jackpot rollover to draws table to track financial details cleanly
alter table public.draws add column if not exists total_prize_pool numeric default 0;
alter table public.draws add column if not exists jackpot_rollover numeric default 0;
