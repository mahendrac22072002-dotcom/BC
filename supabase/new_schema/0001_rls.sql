-- 0001_rls.sql
-- Consolidated RLS for BrokerConnect

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Contact Submissions
CREATE POLICY "Public can insert contact submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can view contact submissions" ON public.contact_submissions FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can update contact submissions" ON public.contact_submissions FOR UPDATE USING (public.is_staff());

-- Profiles
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "Public can view active listings" ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY "Staff can view all listings" ON public.listings FOR SELECT USING (public.is_staff());
CREATE POLICY "Brokers can view own draft listings" ON public.listings FOR SELECT USING (auth.uid() = listing_broker_id);
CREATE POLICY "Brokers can insert listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = listing_broker_id);
CREATE POLICY "Brokers can update own listings" ON public.listings FOR UPDATE USING (auth.uid() = listing_broker_id);
CREATE POLICY "Brokers can delete own listings" ON public.listings FOR DELETE USING (auth.uid() = listing_broker_id);

-- Deal Requests
CREATE POLICY "Brokers can view requests they sent or received" ON public.deal_requests FOR SELECT USING (
  auth.uid() = requesting_broker_id OR auth.uid() = listing_broker_id OR public.is_staff()
);
CREATE POLICY "Brokers can insert requests" ON public.deal_requests FOR INSERT WITH CHECK (auth.uid() = requesting_broker_id);
CREATE POLICY "Brokers can update received requests" ON public.deal_requests FOR UPDATE USING (auth.uid() = listing_broker_id OR public.is_staff());

-- Deal Rooms
CREATE POLICY "Members can view their rooms" ON public.deal_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = public.deal_rooms.id AND user_id = auth.uid()) OR public.is_staff()
);

-- Deal Room Members
CREATE POLICY "Members can view participants" ON public.deal_room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.deal_room_members drm WHERE drm.room_id = public.deal_room_members.room_id AND drm.user_id = auth.uid()) OR public.is_staff()
);
CREATE POLICY "System can insert members" ON public.deal_room_members FOR INSERT WITH CHECK (true); -- Usually handled via RPC or Admin

-- Deal Messages
CREATE POLICY "Members can view messages" ON public.deal_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = public.deal_messages.room_id AND user_id = auth.uid()) OR public.is_staff()
);
CREATE POLICY "Members can insert messages" ON public.deal_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = public.deal_messages.room_id AND user_id = auth.uid())
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Admin Global Fallbacks
CREATE POLICY "Admin All Access" ON public.user_roles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access" ON public.brokers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access" ON public.broker_staff FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access" ON public.subscription_plans FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access" ON public.subscriptions FOR ALL USING (public.is_admin());
