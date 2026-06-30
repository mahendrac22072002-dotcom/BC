BEGIN;

DO $$ 
DECLARE
  v_user_id UUID;
BEGIN
  -- Identify the Platform Owner
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'info.nishantchauhan@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure 'admin' role is granted
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin') THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
    END IF;
    
    -- Ensure 'staff' role is granted (if required for nested staff queries)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'staff') THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'staff');
    END IF;
  END IF;
END $$;

COMMIT;
