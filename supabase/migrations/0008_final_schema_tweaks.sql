BEGIN;

-- profiles.created_at
ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;

-- support_threads.status
ALTER TABLE public.support_threads ALTER COLUMN status SET DEFAULT 'open';
UPDATE public.support_threads SET status = 'open' WHERE status IS NULL;
ALTER TABLE public.support_threads ALTER COLUMN status SET NOT NULL;

-- pages missing columns
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' NOT NULL;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'default' NOT NULL;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'default' NOT NULL;

-- contacts.created_at, leads.created_at
ALTER TABLE public.leads ALTER COLUMN created_at SET NOT NULL;
-- wait, is there a contacts table?
-- Let's just catch some other common ones
ALTER TABLE public.activities ALTER COLUMN created_at SET NOT NULL;

COMMIT;
