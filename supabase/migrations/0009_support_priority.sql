BEGIN;
ALTER TABLE public.support_threads ALTER COLUMN priority SET DEFAULT 'normal';
UPDATE public.support_threads SET priority = 'normal' WHERE priority IS NULL;
ALTER TABLE public.support_threads ALTER COLUMN priority SET NOT NULL;
COMMIT;
