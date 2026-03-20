-- Relax the strict constraints on the winners table safely to explicitly allow rejection routing mechanisms
ALTER TABLE public.winners DROP CONSTRAINT IF EXISTS winners_status_check;
ALTER TABLE public.winners ADD CONSTRAINT winners_status_check CHECK (status in ('pending', 'paid', 'rejected'));
