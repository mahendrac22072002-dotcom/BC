-- Create Deal Requests Table
CREATE TABLE public.deal_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    requesting_broker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_broker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_price numeric,
    commission_proposal text,
    message text,
    notes text,
    expected_closing_date date,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Deal Rooms Table
CREATE TABLE public.deal_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id uuid REFERENCES public.deal_requests(id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    status text DEFAULT 'active' CHECK (status IN ('active', 'pending_documents', 'negotiation', 'closed', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Deal Room Members Table
CREATE TABLE public.deal_room_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text CHECK (role IN ('listing_broker', 'buyer_broker', 'admin', 'staff')),
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);

-- Create Deal Messages Table
CREATE TABLE public.deal_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text,
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'pdf', 'voice')),
    file_url text,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Deal Documents Table
CREATE TABLE public.deal_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    uploader_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    document_url text NOT NULL,
    name text NOT NULL,
    document_type text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Deal Timeline Table
CREATE TABLE public.deal_timeline (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Deal Notifications Table
CREATE TABLE public.deal_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id uuid REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.deal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_notifications
CREATE POLICY "Users can view own notifications" ON public.deal_notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.deal_notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- RLS Policies for deal_requests
CREATE POLICY "Users can view their own deal requests" ON public.deal_requests
FOR SELECT TO authenticated
USING (auth.uid() = requesting_broker_id OR auth.uid() = listing_broker_id OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create deal requests" ON public.deal_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requesting_broker_id);

CREATE POLICY "Listing brokers can update deal requests" ON public.deal_requests
FOR UPDATE TO authenticated
USING (auth.uid() = listing_broker_id OR auth.uid() = requesting_broker_id OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

-- RLS Policies for deal_rooms
CREATE POLICY "Members can view deal rooms" ON public.deal_rooms
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_rooms.id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update deal rooms" ON public.deal_rooms
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

-- RLS Policies for deal_room_members
CREATE POLICY "Members can view room members" ON public.deal_room_members
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.deal_room_members m2 WHERE m2.room_id = deal_room_members.room_id AND m2.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert room members" ON public.deal_room_members
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

-- RLS Policies for deal_messages
CREATE POLICY "Members can view messages" ON public.deal_messages
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_messages.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert messages" ON public.deal_messages
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_messages.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

-- RLS Policies for deal_documents
CREATE POLICY "Members can view documents" ON public.deal_documents
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_documents.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert documents" ON public.deal_documents
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_documents.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

-- RLS Policies for deal_timeline
CREATE POLICY "Members can view timeline" ON public.deal_timeline
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.deal_room_members WHERE room_id = deal_timeline.room_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM staff_roles WHERE user_id = auth.uid()));

CREATE POLICY "System/Admins can insert timeline" ON public.deal_timeline
FOR INSERT TO authenticated
WITH CHECK (true);
