-- BrokerConnect Complete Production Migration SQL
-- Execution Order: Extensions -> Enums -> Schema -> Indexes -> Functions -> Triggers -> RLS -> Storage -> Seed

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. SCHEMA (TABLES)
-- ==========================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    company_name TEXT,
    phone TEXT,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'broker')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    license_number TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.broker_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    features JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15,2),
    property_type TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'pending', 'sold', 'archived')),
    cover_image_url TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    listing_broker_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.deal_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'negotiating', 'closed', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.deal_room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'staff_observer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.deal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    requesting_broker_id UUID REFERENCES auth.users(id),
    listing_broker_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.deal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'resolved', 'archived', 'deleted')),
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.support_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES public.support_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_listings_broker_id ON public.listings(listing_broker_id);
CREATE INDEX idx_deal_requests_listing_id ON public.deal_requests(listing_id);
CREATE INDEX idx_deal_rooms_property_id ON public.deal_rooms(property_id);
CREATE INDEX idx_deal_messages_room_id ON public.deal_messages(room_id);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);

-- ==========================================
-- 4. FUNCTIONS & TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'avatar_url');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'broker');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "System can insert members" ON public.deal_room_members FOR INSERT WITH CHECK (true); 

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
CREATE POLICY "Admin All Access on user_roles" ON public.user_roles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access on brokers" ON public.brokers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access on broker_staff" ON public.broker_staff FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access on subscription_plans" ON public.subscription_plans FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All Access on subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

-- ==========================================
-- 6. STORAGE BUCKETS & POLICIES
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('listing-images', 'listing-images', true),
('kyc', 'kyc', false),
('deal-files', 'deal-files', false),
('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Owner Write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Listing Images Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Listing Images Broker Write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'listing-images' AND 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('broker', 'admin', 'staff'))
);

CREATE POLICY "KYC Owner Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "KYC Staff Read" ON storage.objects FOR SELECT USING (bucket_id = 'kyc' AND public.is_staff());

CREATE POLICY "Deal Files Member Access" ON storage.objects FOR SELECT USING (
  bucket_id = 'deal-files' AND 
  (EXISTS (SELECT 1 FROM public.deal_room_members drm WHERE drm.user_id = auth.uid() AND drm.room_id::text = (storage.foldername(name))[1]) OR public.is_staff())
);
CREATE POLICY "Deal Files Member Write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'deal-files' AND 
  (EXISTS (SELECT 1 FROM public.deal_room_members drm WHERE drm.user_id = auth.uid() AND drm.room_id::text = (storage.foldername(name))[1]) OR public.is_staff())
);

-- ==========================================
-- 7. SEED DATA
-- ==========================================
INSERT INTO public.subscription_plans (name, price_monthly, features) VALUES
('Basic', 49.00, '{"listings_limit": 5, "deal_rooms": false}'::jsonb),
('Pro', 199.00, '{"listings_limit": 50, "deal_rooms": true, "priority_support": true}'::jsonb),
('Enterprise', 499.00, '{"listings_limit": -1, "deal_rooms": true, "white_glove": true}'::jsonb)
ON CONFLICT DO NOTHING;
