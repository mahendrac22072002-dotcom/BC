-- Migration: 0005_fix_deal_rooms_rls
-- Purpose: Remove infinite recursion in RLS policies for deal_rooms by using a SECURITY DEFINER helper function.
-- Preconditions:
--   deal_room_members table exists
-- Postconditions:
--   public.is_room_member() function created
--   Recursive policies dropped and replaced

BEGIN;

-- 1. Create SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_room_member(room_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- We check membership directly, bypassing RLS to avoid recursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.deal_room_members 
    WHERE room_id = room_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public access to ensure security
REVOKE ALL ON FUNCTION public.is_room_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID) TO service_role;

-- 2. Drop existing recursive policies
DROP POLICY IF EXISTS "Members can view participants" ON public.deal_room_members;
DROP POLICY IF EXISTS "Members can view their rooms" ON public.deal_rooms;
DROP POLICY IF EXISTS "Members can view messages" ON public.deal_messages;
DROP POLICY IF EXISTS "Members can insert messages" ON public.deal_messages;

-- 3. Create non-recursive policies
CREATE POLICY "Members can view participants" ON public.deal_room_members 
FOR SELECT USING (public.is_room_member(room_id) OR public.is_staff());

CREATE POLICY "Members can view their rooms" ON public.deal_rooms 
FOR SELECT USING (public.is_room_member(id) OR public.is_staff());

CREATE POLICY "Members can view messages" ON public.deal_messages 
FOR SELECT USING (public.is_room_member(room_id) OR public.is_staff());

CREATE POLICY "Members can insert messages" ON public.deal_messages 
FOR INSERT WITH CHECK (public.is_room_member(room_id));

-- Verify Function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_room_member'
  ) THEN
    RAISE EXCEPTION 'Verification failed: is_room_member function not created';
  END IF;
END $$;

COMMIT;
