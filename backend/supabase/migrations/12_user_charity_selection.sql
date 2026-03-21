-- Add direct dependency mapping so users explicitly structurally link to a precise Charity logic 
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_charity_id uuid references public.charities(id);

-- Systematically rewrite the automated Postgres creation Trigger to parse the Registration MetaData rigorously
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, selected_charity_id)
  VALUES (
      new.id, 
      new.email, 
      'user', 
      (new.raw_user_meta_data->>'charity_id')::uuid
  );
  RETURN NEW;
END;
$$;

-- Securely bypass generic RLS safely permitting Razorpay verification nodes structurally updating charity capital
CREATE OR REPLACE FUNCTION public.increment_charity_amount(p_charity_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.charities
  SET amount_raised = COALESCE(amount_raised, 0) + p_amount
  WHERE id = p_charity_id;
END;
$$;

-- Safely allow clients to functionally bypass Role restrictions to exclusively update Charity Preferences exclusively securely
CREATE OR REPLACE FUNCTION public.update_user_charity_prefs(p_user_id uuid, p_percentage integer, p_charity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_percentage < 10 OR p_percentage > 100 THEN
     RAISE EXCEPTION 'Charity Allocation explicitly requires 10 percent minimum bounds';
  END IF;

  UPDATE public.users 
  SET charity_percentage = p_percentage,
      selected_charity_id = p_charity_id
  WHERE id = p_user_id;
END;
$$;
