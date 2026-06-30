BEGIN;

-- 1. Create Enums that were missed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_moderation_status') THEN
    CREATE TYPE public.listing_moderation_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested', 'hidden');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_report_status') THEN
    CREATE TYPE public.listing_report_status AS ENUM ('open', 'resolved', 'dismissed', 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_kind') THEN
    CREATE TYPE public.notification_kind AS ENUM ('listing_approved', 'listing_rejected', 'listing_hidden', 'listing_featured', 'kyc_approved', 'kyc_rejected', 'support_reply', 'subscription_expiring', 'system_announcement', 'report_update');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_stage') THEN
    CREATE TYPE public.deal_stage AS ENUM ('prospect', 'site_visit', 'offer', 'negotiation', 'won', 'lost', 'agreement', 'closed_won', 'closed_lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE public.lead_source AS ENUM ('website', 'referral', 'marketplace', 'cold_call', 'social', 'event', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_visibility') THEN
    CREATE TYPE public.page_visibility AS ENUM ('public', 'private', 'authenticated');
  END IF;
END $$;

ALTER TABLE public.listing_status_history ADD COLUMN IF NOT EXISTS previous_status public.listing_moderation_status;

ALTER TABLE public.listings ALTER COLUMN moderation_status TYPE public.listing_moderation_status USING moderation_status::public.listing_moderation_status;
ALTER TABLE public.listing_reports ALTER COLUMN status TYPE public.listing_report_status USING status::public.listing_report_status;
ALTER TABLE public.notifications ALTER COLUMN kind TYPE public.notification_kind USING kind::public.notification_kind;
ALTER TABLE public.leads ALTER COLUMN status TYPE public.lead_status USING status::public.lead_status;
ALTER TABLE public.deals ALTER COLUMN stage TYPE public.deal_stage USING stage::public.deal_stage;
ALTER TABLE public.leads ALTER COLUMN source TYPE public.lead_source USING source::public.lead_source;

-- 3. Fix missing/wrong columns
ALTER TABLE public.support_messages DROP COLUMN IF EXISTS body;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS message TEXT;
UPDATE public.support_messages SET message = '' WHERE message IS NULL;
ALTER TABLE public.support_messages ALTER COLUMN message SET DEFAULT '';
ALTER TABLE public.support_messages ALTER COLUMN message SET NOT NULL;

ALTER TABLE public.deal_messages DROP COLUMN IF EXISTS body;
ALTER TABLE public.deal_messages ADD COLUMN IF NOT EXISTS message TEXT;
UPDATE public.deal_messages SET message = '' WHERE message IS NULL;
ALTER TABLE public.deal_messages ALTER COLUMN message SET DEFAULT '';
ALTER TABLE public.deal_messages ALTER COLUMN message SET NOT NULL;

ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_monthly NUMERIC;
UPDATE public.subscription_plans SET price_monthly = price_inr WHERE price_monthly IS NULL;
ALTER TABLE public.subscription_plans ALTER COLUMN price_monthly SET DEFAULT 0;
ALTER TABLE public.subscription_plans ALTER COLUMN price_monthly SET NOT NULL;

ALTER TABLE public.webhooks ALTER COLUMN is_active SET DEFAULT true;
UPDATE public.webhooks SET is_active = true WHERE is_active IS NULL;
ALTER TABLE public.webhooks ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE public.leads ALTER COLUMN source SET DEFAULT 'other'::public.lead_source;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new'::public.lead_status;
ALTER TABLE public.deals ALTER COLUMN stage SET DEFAULT 'prospect'::public.deal_stage;
ALTER TABLE public.forms ALTER COLUMN published SET DEFAULT false;
ALTER TABLE public.forms ALTER COLUMN success_message SET DEFAULT '';
ALTER TABLE public.media_assets ALTER COLUMN folder SET DEFAULT 'uploads';
ALTER TABLE public.nav_items ALTER COLUMN open_in_new_tab SET DEFAULT false;
ALTER TABLE public.nav_items ALTER COLUMN visible SET DEFAULT true;
ALTER TABLE public.pages ALTER COLUMN featured SET DEFAULT false;
ALTER TABLE public.pages ALTER COLUMN nav_order SET DEFAULT 0;
ALTER TABLE public.pages ALTER COLUMN robots SET DEFAULT 'index, follow';
ALTER TABLE public.pages ALTER COLUMN show_in_footer SET DEFAULT false;
ALTER TABLE public.pages ALTER COLUMN show_in_nav SET DEFAULT false;
ALTER TABLE public.pages ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.blog_posts ALTER COLUMN reading_minutes SET DEFAULT 0;
ALTER TABLE public.blog_posts ALTER COLUMN status SET DEFAULT 'draft';

-- NOT NULL constraints
ALTER TABLE public.listings ALTER COLUMN broker_id SET NOT NULL;
ALTER TABLE public.support_threads ALTER COLUMN opener_id SET NOT NULL;
ALTER TABLE public.support_messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE public.deal_rooms ALTER COLUMN deal_id SET NOT NULL;
ALTER TABLE public.deals ALTER COLUMN listing_id SET NOT NULL;
ALTER TABLE public.kyc_documents ALTER COLUMN broker_id SET NOT NULL;
ALTER TABLE public.deals ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN owner_id SET NOT NULL;

COMMIT;
