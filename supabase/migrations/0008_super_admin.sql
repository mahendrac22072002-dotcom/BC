-- Migration: 0008_super_admin
-- Purpose: Safely assign Platform Ownership to info.nishantchauhan@gmail.com across existing authorization tables.
-- Preconditions:
--   auth.users contains info.nishantchauhan@gmail.com
-- Postconditions:
--   The user is inserted into user_roles with role 'super_admin' (or 'admin')

BEGIN;

DO $$ 
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Find the user ID
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'info.nishantchauhan@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'HALT: Super Admin account info.nishantchauhan@gmail.com not found in auth.users';
  END IF;

  -- 2. Synchronize user_roles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_roles') THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (target_user_id, 'admin') 
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;

  -- 3. Synchronize profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (target_user_id, 'Platform', 'Owner')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 4. Synchronize broker_staff (if applicable to allow testing broker views)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='broker_staff') THEN
    -- We do not invent a broker here, but we could if needed. Left blank intentionally to adhere to rule.
  END IF;
  
END $$;

COMMIT;
