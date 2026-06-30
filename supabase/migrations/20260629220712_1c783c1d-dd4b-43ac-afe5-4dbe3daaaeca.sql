
-- Realtime for support chats
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_threads REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Public read access on published CMS pages
GRANT SELECT ON public.pages TO anon;
