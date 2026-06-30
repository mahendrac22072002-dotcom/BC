BEGIN;

-- 1. Deal messages: swap message/content to match frontend
ALTER TABLE public.deal_messages DROP COLUMN IF EXISTS message;
ALTER TABLE public.deal_messages DROP COLUMN IF EXISTS body;
ALTER TABLE public.deal_messages ADD COLUMN IF NOT EXISTS content TEXT;
UPDATE public.deal_messages SET content = '' WHERE content IS NULL;
ALTER TABLE public.deal_messages ALTER COLUMN content SET DEFAULT '';
ALTER TABLE public.deal_messages ALTER COLUMN content SET NOT NULL;

-- 2. Support messages: drop message, use body
ALTER TABLE public.support_messages DROP COLUMN IF EXISTS message;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS body TEXT;
UPDATE public.support_messages SET body = '' WHERE body IS NULL;
ALTER TABLE public.support_messages ALTER COLUMN body SET DEFAULT '';
ALTER TABLE public.support_messages ALTER COLUMN body SET NOT NULL;

-- 3. Deal rooms: missing request_id and property_id
ALTER TABLE public.deal_rooms ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.deal_requests(id);
ALTER TABLE public.deal_rooms ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.listings(id);

-- 4. Foreign keys for relations
-- deal_messages -> profiles
ALTER TABLE public.deal_messages DROP CONSTRAINT IF EXISTS deal_messages_sender_id_fkey;
ALTER TABLE public.deal_messages ADD CONSTRAINT deal_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

-- deal_room_members -> profiles
ALTER TABLE public.deal_room_members DROP CONSTRAINT IF EXISTS deal_room_members_user_id_fkey;
ALTER TABLE public.deal_room_members ADD CONSTRAINT deal_room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- deal_requests -> listings
ALTER TABLE public.deal_requests DROP CONSTRAINT IF EXISTS deal_requests_property_id_fkey;
ALTER TABLE public.deal_requests DROP CONSTRAINT IF EXISTS deal_requests_listing_id_fkey;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.deal_requests ADD CONSTRAINT deal_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.listings(id);

-- deal_requests -> profiles
ALTER TABLE public.deal_requests DROP CONSTRAINT IF EXISTS deal_requests_requesting_broker_id_fkey;
ALTER TABLE public.deal_requests ADD CONSTRAINT deal_requests_requesting_broker_id_fkey FOREIGN KEY (requesting_broker_id) REFERENCES public.profiles(id);

ALTER TABLE public.deal_requests DROP CONSTRAINT IF EXISTS deal_requests_listing_broker_id_fkey;
ALTER TABLE public.deal_requests ADD CONSTRAINT deal_requests_listing_broker_id_fkey FOREIGN KEY (listing_broker_id) REFERENCES public.profiles(id);

-- listings -> profiles
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_broker_id_fkey;
ALTER TABLE public.listings ADD CONSTRAINT listings_broker_id_fkey FOREIGN KEY (broker_id) REFERENCES public.profiles(id);

-- 5. NOT NULLs
ALTER TABLE public.subscription_plans ALTER COLUMN sort_order SET DEFAULT 0;
UPDATE public.subscription_plans SET sort_order = 0 WHERE sort_order IS NULL;
ALTER TABLE public.subscription_plans ALTER COLUMN sort_order SET NOT NULL;

ALTER TABLE public.subscriptions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.deal_requests ALTER COLUMN status SET DEFAULT 'pending';
UPDATE public.deal_requests SET status = 'pending' WHERE status IS NULL;
ALTER TABLE public.deal_requests ALTER COLUMN status SET NOT NULL;

COMMIT;
