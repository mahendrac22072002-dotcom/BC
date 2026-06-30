-- Fix incorrect RLS referencing non-existent staff_roles table
-- Replace with user_roles

-- 1. Contact Submissions
DROP POLICY IF EXISTS "Only staff can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Only staff can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Only staff can delete contact submissions" ON public.contact_submissions;

CREATE POLICY "Only staff can view contact submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin')
  ));

CREATE POLICY "Only staff can update contact submissions"
  ON public.contact_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin')
  ));

CREATE POLICY "Only staff can delete contact submissions"
  ON public.contact_submissions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin')
  ));

-- Make sure public/anon can insert (already TO public in previous migration, but explicitly ensuring anon can insert)
DROP POLICY IF EXISTS "Anyone can insert contact submission" ON public.contact_submissions;
CREATE POLICY "Anyone can insert contact submission"
  ON public.contact_submissions FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Deal Requests
DROP POLICY IF EXISTS "Brokers can view own requests, Staff can view all" ON public.deal_requests;
DROP POLICY IF EXISTS "Brokers can update own requests, Staff can update all" ON public.deal_requests;

CREATE POLICY "Brokers can view own requests, Staff can view all"
  ON public.deal_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requesting_broker_id OR 
    auth.uid() = listing_broker_id OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

CREATE POLICY "Brokers can update own requests, Staff can update all"
  ON public.deal_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = listing_broker_id OR 
    auth.uid() = requesting_broker_id OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

-- 3. Deal Rooms
DROP POLICY IF EXISTS "Members can view room, Staff can view all" ON public.deal_rooms;
DROP POLICY IF EXISTS "Only staff can update deal rooms" ON public.deal_rooms;

CREATE POLICY "Members can view room, Staff can view all"
  ON public.deal_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_rooms.id AND user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

CREATE POLICY "Only staff can update deal rooms"
  ON public.deal_rooms FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin')));

-- 4. Deal Room Members
DROP POLICY IF EXISTS "Members can view members, Staff can view all" ON public.deal_room_members;
DROP POLICY IF EXISTS "Only staff can manage members" ON public.deal_room_members;

CREATE POLICY "Members can view members, Staff can view all"
  ON public.deal_room_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deal_room_members m2 WHERE m2.room_id = deal_room_members.room_id AND m2.user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

CREATE POLICY "Only staff can manage members"
  ON public.deal_room_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin')));

-- 5. Deal Messages
DROP POLICY IF EXISTS "Members can view messages, Staff can view all" ON public.deal_messages;
DROP POLICY IF EXISTS "Members can insert messages, Staff can insert all" ON public.deal_messages;

CREATE POLICY "Members can view messages, Staff can view all"
  ON public.deal_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_messages.room_id AND user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

CREATE POLICY "Members can insert messages, Staff can insert all"
  ON public.deal_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_messages.room_id AND user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

-- 6. Deal Documents
DROP POLICY IF EXISTS "Members can view docs, Staff can view all" ON public.deal_documents;
DROP POLICY IF EXISTS "Members can insert docs, Staff can insert all" ON public.deal_documents;

CREATE POLICY "Members can view docs, Staff can view all"
  ON public.deal_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_documents.room_id AND user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

CREATE POLICY "Members can insert docs, Staff can insert all"
  ON public.deal_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_documents.room_id AND user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

-- 7. Deal Timeline
DROP POLICY IF EXISTS "Members can view timeline, Staff can view all" ON public.deal_timeline;

CREATE POLICY "Members can view timeline, Staff can view all"
  ON public.deal_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_timeline.room_id AND user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('staff', 'admin'))
  );

-- 8. Subscription Plans enhancements
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS razorpay_plan_id text,
  ADD COLUMN IF NOT EXISTS highlighted boolean DEFAULT false;
