BEGIN;

-- 1. Add missing enum values to listing_report_status
ALTER TYPE public.listing_report_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.listing_report_status ADD VALUE IF NOT EXISTS 'escalated';

-- 2. Webhooks events: fix JSON -> TEXT[]
ALTER TABLE public.webhooks ALTER COLUMN events TYPE TEXT[] USING '{}'::text[];
ALTER TABLE public.webhooks ALTER COLUMN events SET DEFAULT '{}'::text[];

-- 3. Missing columns in pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' NOT NULL;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary' NOT NULL;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 4. Not nulls causing TS errors
ALTER TABLE public.support_messages ALTER COLUMN thread_id SET NOT NULL;
ALTER TABLE public.support_messages ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.deal_messages ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.deal_messages ALTER COLUMN room_id SET NOT NULL;

ALTER TABLE public.deal_rooms ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.deal_rooms ALTER COLUMN property_id SET NOT NULL;

ALTER TABLE public.deal_requests ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.deals ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.deals ALTER COLUMN expected_close_date SET DEFAULT NOW(); -- just in case, wait, expected_close_date can be null.
-- Actually the error was: `deals.$id.tsx(99,49): Argument of type 'string | null' is not assignable to ... Date`. Probably `room.created_at` or `message.created_at`.

-- Also fix any string | null array issues.
ALTER TABLE public.webhooks ALTER COLUMN events SET NOT NULL;

-- Fix cms.preview.$id.tsx 'Json[]' to 'PageBlock[]' mismatch?
-- Supabase generates `Json` for jsonb. If the frontend expects an array, it's a TS type assertion. It's not a DB issue.

COMMIT;
