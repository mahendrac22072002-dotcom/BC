
-- Recreate helpers in the private schema
CREATE OR REPLACE FUNCTION private.is_verified(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND kyc_status = 'verified')
$$;
REVOKE EXECUTE ON FUNCTION private.is_verified(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations
                 WHERE id = _conversation_id AND (broker_a = _user_id OR broker_b = _user_id))
$$;
REVOKE EXECUTE ON FUNCTION private.is_conversation_participant(uuid, uuid) FROM PUBLIC;

-- Rewire policies that reference public.is_verified / public.is_conversation_participant

-- profiles
DROP POLICY IF EXISTS "Verified brokers view verified profiles" ON public.profiles;
CREATE POLICY "Verified brokers view verified profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (kyc_status = 'verified' AND private.is_verified(auth.uid()));

-- listings
DROP POLICY IF EXISTS "Verified brokers view active listings" ON public.listings;
CREATE POLICY "Verified brokers view active listings"
  ON public.listings FOR SELECT TO authenticated
  USING (status = 'active' AND private.is_verified(auth.uid()));

-- connections
DROP POLICY IF EXISTS "Verified requester creates connection" ON public.connections;
CREATE POLICY "Verified requester creates connection"
  ON public.connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND private.is_verified(auth.uid()));

-- conversations
DROP POLICY IF EXISTS "Verified brokers create conversation" ON public.conversations;
CREATE POLICY "Verified brokers create conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (private.is_verified(auth.uid()) AND (auth.uid() = broker_a OR auth.uid() = broker_b));

-- messages
DROP POLICY IF EXISTS "Participants view messages" ON public.messages;
CREATE POLICY "Participants view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (private.is_conversation_participant(auth.uid(), conversation_id));

DROP POLICY IF EXISTS "Sender posts in own conversation" ON public.messages;
CREATE POLICY "Sender posts in own conversation"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid()
              AND private.is_conversation_participant(auth.uid(), conversation_id));

-- Drop the now-unused public helpers
DROP FUNCTION IF EXISTS public.is_verified(uuid);
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid, uuid);
