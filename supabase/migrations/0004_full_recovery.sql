-- Migration: 0004_full_recovery
-- Purpose: Add missing tables, columns, and relations derived from codebase source-of-truth.
-- Preconditions: Base schema exists
-- Postconditions: All frontend-expected schema objects exist

BEGIN;

-- 1. Create Enums (Idempotent using DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('broker', 'staff', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blog_status') THEN
    CREATE TYPE public.blog_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
    CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'declined', 'prospect', 'site_visit', 'offer', 'agreement', 'closed_won', 'closed_lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_doc_status') THEN
    CREATE TYPE public.kyc_doc_status AS ENUM ('uploaded', 'approved', 'rejected', 'aadhaar', 'pan', 'rera', 'license', 'other', 'broker_photo', 'visiting_card', 'office_photo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE public.kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'website', 'referral', 'marketplace', 'cold_call', 'social', 'event', 'other', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'approved', 'hidden', 'changes_requested', 'open', 'assigned', 'resolved', 'dismissed', 'escalated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
    CREATE TYPE public.listing_type AS ENUM ('sale', 'rent', 'lease');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nav_location') THEN
    CREATE TYPE public.nav_location AS ENUM ('header', 'footer', 'kyc_approved', 'kyc_rejected', 'listing_approved', 'listing_rejected', 'listing_hidden', 'listing_featured', 'support_reply', 'subscription_expiring', 'system_announcement', 'report_update');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_status') THEN
    CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'scheduled', 'archived', 'apartment', 'villa', 'plot', 'commercial', 'office', 'retail', 'warehouse', 'other', 'trialing', 'active', 'past_due', 'canceled', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_priority') THEN
    CREATE TYPE public.support_priority AS ENUM ('low', 'normal', 'high', 'urgent');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_status') THEN
    CREATE TYPE public.support_status AS ENUM ('open', 'pending', 'resolved', 'closed');
  END IF;
END $$;

-- 2. Create Missing Tables
CREATE TABLE IF NOT EXISTS public.deal_timeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
     UUID NOT NULL,
    action TEXT NOT NULL,
     UUID,
    details JSONB
);

CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
     UUID NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activities (
    body TEXT,
    completed_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
     UUID,
    due_at TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID,
     UUID NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    action TEXT NOT NULL,
     UUID,
    after JSONB,
    before JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metadata JSONB,
    resource TEXT NOT NULL,
     UUID
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by TEXT,
    hashed_key TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_used_at TEXT,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
     UUID NOT NULL,
     UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
     UUID,
    body TEXT NOT NULL,
     UUID,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    excerpt TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    published_at TEXT,
    reading_minutes NUMERIC NOT NULL,
    scheduled_at TEXT,
    seo_description TEXT,
    seo_title TEXT,
    slug TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.blog_tags (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.connections (
     UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message TEXT,
     UUID NOT NULL,
    status TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversations (
    broker_a TEXT NOT NULL,
    broker_b TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_message_at TEXT NOT NULL,
     UUID
);

CREATE TABLE IF NOT EXISTS public.deals (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expected_close_date TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID,
     UUID,
    notes TEXT,
     UUID NOT NULL,
    probability NUMERIC,
    stage TEXT NOT NULL,
    title TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    value NUMERIC
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
     UUID NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ip_hash TEXT,
    payload JSONB NOT NULL,
    submitted_by TEXT,
    submitter_email TEXT
);

CREATE TABLE IF NOT EXISTS public.forms (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by TEXT,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    notify_email TEXT,
    published BOOLEAN NOT NULL,
    schema JSONB NOT NULL,
    slug TEXT NOT NULL,
    success_message TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leads (
    budget_max NUMERIC,
    budget_min NUMERIC,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    email TEXT,
    full_name TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    notes TEXT,
     UUID NOT NULL,
    phone TEXT,
    requirement TEXT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.listing_reports (
    assigned_to TEXT,
    attachments JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL,
    reason TEXT NOT NULL,
     UUID NOT NULL,
    resolution_notes TEXT,
    resolved_at TEXT,
    status TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.listing_status_history (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL,
     UUID,
    new_status TEXT NOT NULL,
    notes TEXT,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS public.media_assets (
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    filename TEXT NOT NULL,
    folder TEXT NOT NULL,
    height NUMERIC,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mime_type TEXT NOT NULL,
    size_bytes NUMERIC NOT NULL,
    storage_path TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    uploaded_by TEXT,
    width NUMERIC
);

CREATE TABLE IF NOT EXISTS public.messages (
    body TEXT NOT NULL,
     UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.nav_items (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    href TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    label TEXT NOT NULL,
    location TEXT NOT NULL,
    open_in_new_tab BOOLEAN NOT NULL,
     UUID,
    position NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    visible BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS public.page_revisions (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
     UUID,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL,
    reason TEXT,
    snapshot JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.page_sections (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL,
    position NUMERIC NOT NULL,
    props JSONB NOT NULL,
    section_type TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pages (
     UUID,
    blocks JSONB NOT NULL,
    body TEXT,
    canonical_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    draft_blocks JSONB,
    draft_body TEXT,
    featured BOOLEAN NOT NULL,
    icon TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keywords TEXT,
    nav_order NUMERIC NOT NULL,
    og_image TEXT,
    page_type TEXT NOT NULL,
     UUID,
    published_at TEXT,
    robots TEXT NOT NULL,
    scheduled_at TEXT,
    schema_jsonld JSONB,
    seo_description TEXT,
    seo_title TEXT,
    show_in_footer BOOLEAN NOT NULL,
    show_in_nav BOOLEAN NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL,
    template TEXT NOT NULL,
    theme JSONB NOT NULL,
    title TEXT NOT NULL,
    twitter_card TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    visibility TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permissions (
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    brand_name TEXT NOT NULL,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    footer_html TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seo_description TEXT,
    seo_title TEXT,
    singleton BOOLEAN NOT NULL,
    social_links JSONB NOT NULL,
    support_email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_attachments (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    file_path TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL,
    mime_type TEXT,
    size_bytes NUMERIC
);

CREATE TABLE IF NOT EXISTS public.support_internal_notes (
     UUID NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.webhooks (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by TEXT,
    events JSONB NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    is_active BOOLEAN NOT NULL,
    name TEXT NOT NULL,
    secret TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    url TEXT NOT NULL
);

-- 3. Add Missing Columns to Existing Tables
ALTER TABLE public.deal_rooms ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.deal_room_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.deal_room_members ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.deal_room_members ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS offer_price NUMERIC;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS commission_proposal TEXT;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS expected_closing_date TEXT;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.deal_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.deal_messages ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS doc_type TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS version NUMERIC;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS area_sqft NUMERIC;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS bedrooms NUMERIC;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS listing_type TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_notes TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_status TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS kind TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firm TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_submitted_at TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_kyc_submitted BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_listing_published BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_network_started BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_profile_completed BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS interval TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS listing_limit NUMERIC;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_inr NUMERIC;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS sort_order NUMERIC;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS cta_url TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS trial_days NUMERIC;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS highlighted BOOLEAN;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS started_at TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS closed_at TEXT;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS last_message_at TEXT;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS  UUID;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.support_threads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Add Foreign Keys for Missing Tables (Idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deal_rooms_deal_id') THEN
    ALTER TABLE public.deal_rooms ADD CONSTRAINT fk_deal_rooms_deal_id FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_activities_deal_id') THEN
    ALTER TABLE public.activities ADD CONSTRAINT fk_activities_deal_id FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_activities_lead_id') THEN
    ALTER TABLE public.activities ADD CONSTRAINT fk_activities_lead_id FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_post_tags_post_id') THEN
    ALTER TABLE public.blog_post_tags ADD CONSTRAINT fk_blog_post_tags_post_id FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_post_tags_tag_id') THEN
    ALTER TABLE public.blog_post_tags ADD CONSTRAINT fk_blog_post_tags_tag_id FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_posts_category_id') THEN
    ALTER TABLE public.blog_posts ADD CONSTRAINT fk_blog_posts_category_id FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_listing_id') THEN
    ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_lead_id') THEN
    ALTER TABLE public.deals ADD CONSTRAINT fk_deals_lead_id FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_listing_id') THEN
    ALTER TABLE public.deals ADD CONSTRAINT fk_deals_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_form_submissions_form_id') THEN
    ALTER TABLE public.form_submissions ADD CONSTRAINT fk_form_submissions_form_id FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_listing_reports_listing_id') THEN
    ALTER TABLE public.listing_reports ADD CONSTRAINT fk_listing_reports_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_listing_status_history_listing_id') THEN
    ALTER TABLE public.listing_status_history ADD CONSTRAINT fk_listing_status_history_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_conversation_id') THEN
    ALTER TABLE public.messages ADD CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nav_items_parent_id') THEN
    ALTER TABLE public.nav_items ADD CONSTRAINT fk_nav_items_parent_id FOREIGN KEY (parent_id) REFERENCES public.nav_items(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_page_revisions_page_id') THEN
    ALTER TABLE public.page_revisions ADD CONSTRAINT fk_page_revisions_page_id FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_page_sections_page_id') THEN
    ALTER TABLE public.page_sections ADD CONSTRAINT fk_page_sections_page_id FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_pages_parent_id') THEN
    ALTER TABLE public.pages ADD CONSTRAINT fk_pages_parent_id FOREIGN KEY (parent_id) REFERENCES public.pages(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_role_permissions_permission_id') THEN
    ALTER TABLE public.role_permissions ADD CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_subscriptions_plan_id') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_plan_id FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_support_attachments_message_id') THEN
    ALTER TABLE public.support_attachments ADD CONSTRAINT fk_support_attachments_message_id FOREIGN KEY (message_id) REFERENCES public.support_messages(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_support_internal_notes_thread_id') THEN
    ALTER TABLE public.support_internal_notes ADD CONSTRAINT fk_support_internal_notes_thread_id FOREIGN KEY (thread_id) REFERENCES public.support_threads(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_support_messages_thread_id') THEN
    ALTER TABLE public.support_messages ADD CONSTRAINT fk_support_messages_thread_id FOREIGN KEY (thread_id) REFERENCES public.support_threads(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
