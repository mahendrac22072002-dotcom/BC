
-- Enums
DO $$ BEGIN
  CREATE TYPE public.property_type AS ENUM ('apartment','villa','plot','commercial','office','retail','warehouse','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.listing_type AS ENUM ('sale','rent','lease');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('draft','active','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.connection_status AS ENUM ('pending','accepted','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.kyc_doc_type AS ENUM ('aadhaar','pan','rera','license','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.kyc_doc_status AS ENUM ('uploaded','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: verified broker
CREATE OR REPLACE FUNCTION public.is_verified(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND kyc_status = 'verified')
$$;
REVOKE EXECUTE ON FUNCTION public.is_verified(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified(uuid) TO authenticated, service_role;

-- Profiles: directory access for verified brokers
DROP POLICY IF EXISTS "Verified brokers view verified profiles" ON public.profiles;
CREATE POLICY "Verified brokers view verified profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (kyc_status = 'verified' AND public.is_verified(auth.uid()));

-- LISTINGS
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  property_type public.property_type NOT NULL DEFAULT 'apartment',
  listing_type public.listing_type NOT NULL DEFAULT 'sale',
  status public.listing_status NOT NULL DEFAULT 'draft',
  price numeric(14,2),
  city text NOT NULL,
  locality text,
  bedrooms int,
  bathrooms int,
  area_sqft int,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers manage own listings"
  ON public.listings FOR ALL TO authenticated
  USING (broker_id = auth.uid()) WITH CHECK (broker_id = auth.uid());
CREATE POLICY "Verified brokers view active listings"
  ON public.listings FOR SELECT TO authenticated
  USING (status = 'active' AND public.is_verified(auth.uid()));
CREATE POLICY "Staff view all listings"
  ON public.listings FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::public.app_role));
CREATE POLICY "Admins manage all listings"
  ON public.listings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_listings_updated_at ON public.listings;
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS idx_listings_broker ON public.listings(broker_id);
CREATE INDEX IF NOT EXISTS idx_listings_city_active ON public.listings(city) WHERE status = 'active';

-- CONNECTIONS
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Either party views connection"
  ON public.connections FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Verified requester creates connection"
  ON public.connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND public.is_verified(auth.uid()));
CREATE POLICY "Addressee updates connection"
  ON public.connections FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid()) WITH CHECK (addressee_id = auth.uid());
CREATE POLICY "Either party deletes connection"
  ON public.connections FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
DROP TRIGGER IF EXISTS trg_connections_updated_at ON public.connections;
CREATE TRIGGER trg_connections_updated_at BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONVERSATIONS + MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (broker_a < broker_b)
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_conversation_pair_listing
  ON public.conversations (broker_a, broker_b, COALESCE(listing_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = broker_a OR auth.uid() = broker_b);
CREATE POLICY "Verified brokers create conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (public.is_verified(auth.uid()) AND (auth.uid() = broker_a OR auth.uid() = broker_b));
CREATE POLICY "Participants update conversation"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = broker_a OR auth.uid() = broker_b)
  WITH CHECK (auth.uid() = broker_a OR auth.uid() = broker_b);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations
                 WHERE id = _conversation_id AND (broker_a = _user_id OR broker_b = _user_id))
$$;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Participants view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));
CREATE POLICY "Sender posts in own conversation"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()
              AND public.is_conversation_participant(auth.uid(), conversation_id));

CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_messages_bump ON public.messages;
CREATE TRIGGER trg_messages_bump AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- KYC DOCUMENTS
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.kyc_doc_type NOT NULL,
  file_path text NOT NULL,
  status public.kyc_doc_status NOT NULL DEFAULT 'uploaded',
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers manage own KYC docs"
  ON public.kyc_documents FOR ALL TO authenticated
  USING (broker_id = auth.uid()) WITH CHECK (broker_id = auth.uid());
CREATE POLICY "Staff view KYC docs"
  ON public.kyc_documents FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::public.app_role));
CREATE POLICY "Admins manage KYC docs"
  ON public.kyc_documents FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX IF NOT EXISTS idx_kyc_broker ON public.kyc_documents(broker_id);

-- STORAGE OBJECT POLICIES (buckets already created via the storage tool)
-- listings bucket: authenticated brokers read; owner-folder writes
DROP POLICY IF EXISTS "Listing images authenticated read" ON storage.objects;
CREATE POLICY "Listing images authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listings');
DROP POLICY IF EXISTS "Brokers upload own listing images" ON storage.objects;
CREATE POLICY "Brokers upload own listing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Brokers update own listing images" ON storage.objects;
CREATE POLICY "Brokers update own listing images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Brokers delete own listing images" ON storage.objects;
CREATE POLICY "Brokers delete own listing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- kyc bucket: owner read/write; staff/admin read
DROP POLICY IF EXISTS "Brokers read own KYC files" ON storage.objects;
CREATE POLICY "Brokers read own KYC files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Brokers upload own KYC files" ON storage.objects;
CREATE POLICY "Brokers upload own KYC files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Brokers delete own KYC files" ON storage.objects;
CREATE POLICY "Brokers delete own KYC files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Staff read all KYC files" ON storage.objects;
CREATE POLICY "Staff read all KYC files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc'
         AND (private.has_role(auth.uid(), 'staff'::public.app_role)
              OR private.has_role(auth.uid(), 'admin'::public.app_role)));
