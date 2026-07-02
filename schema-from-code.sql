-- SCHEMA GENERATED FROM CODEBASE EXPECTATIONS

CREATE TYPE public.app_role AS ENUM ('broker', 'staff', 'admin');
CREATE TYPE public.blog_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'declined', 'prospect', 'site_visit', 'offer', 'agreement', 'closed_won', 'closed_lost');
CREATE TYPE public.kyc_doc_status AS ENUM ('uploaded', 'approved', 'rejected', 'aadhaar', 'pan', 'rera', 'license', 'other', 'broker_photo', 'visiting_card', 'office_photo');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'website', 'referral', 'marketplace', 'cold_call', 'social', 'event', 'other', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'pending', 'approved', 'rejected', 'hidden', 'changes_requested', 'open', 'assigned', 'resolved', 'dismissed', 'escalated');
CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.listing_type AS ENUM ('sale', 'rent', 'lease');
CREATE TYPE public.nav_location AS ENUM ('header', 'footer', 'kyc_approved', 'kyc_rejected', 'listing_approved', 'listing_rejected', 'listing_hidden', 'listing_featured', 'support_reply', 'subscription_expiring', 'system_announcement', 'report_update');
CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'scheduled', 'archived', 'apartment', 'villa', 'plot', 'commercial', 'office', 'retail', 'warehouse', 'other', 'trialing', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE public.support_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.support_status AS ENUM ('open', 'pending', 'resolved', 'closed');

CREATE TABLE public.contact_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT,
    notes TEXT
);

CREATE TABLE public.deal_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deal_id TEXT
);

CREATE TABLE public.deal_room_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT,
    listing_broker_id TEXT,
    requesting_broker_id TEXT
);

CREATE TABLE public.deal_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    property_id TEXT,
    listing_id TEXT,
    request_id TEXT,
    status TEXT,
    listing_broker_id TEXT,
    requesting_broker_id TEXT,
    offer_price NUMERIC,
    commission_proposal TEXT,
    expected_closing_date TEXT,
    message TEXT,
    notes TEXT
);

CREATE TABLE public.deal_timeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    room_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id TEXT,
    details JSONB
);

CREATE TABLE public.deal_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    body TEXT NOT NULL
);

CREATE TABLE public.staff_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE public.activities (
    body TEXT,
    completed_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deal_id TEXT,
    due_at TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id TEXT,
    owner_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    type public.public NOT NULL
);

CREATE TABLE public.admin_audit_log (
    action TEXT NOT NULL,
    actor_id TEXT,
    after JSONB,
    before JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metadata JSONB,
    resource TEXT NOT NULL,
    resource_id TEXT
);

CREATE TABLE public.api_keys (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by TEXT,
    hashed_key TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_used_at TEXT,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    revoked_at TEXT
);

CREATE TABLE public.blog_categories (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

CREATE TABLE public.blog_post_tags (
    post_id TEXT NOT NULL,
    tag_id TEXT NOT NULL
);

CREATE TABLE public.blog_posts (
    author_id TEXT,
    body TEXT NOT NULL,
    category_id TEXT,
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
    status public.public NOT NULL,
    title TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.blog_tags (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
);

CREATE TABLE public.connections (
    addressee_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message TEXT,
    requester_id TEXT NOT NULL,
    status public.public NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.conversations (
    broker_a TEXT NOT NULL,
    broker_b TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_message_at TEXT NOT NULL,
    listing_id TEXT
);

CREATE TABLE public.deals (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expected_close_date TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id TEXT,
    listing_id TEXT,
    notes TEXT,
    owner_id TEXT NOT NULL,
    probability NUMERIC,
    stage public.public NOT NULL,
    title TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    value NUMERIC
);

CREATE TABLE public.form_submissions (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    form_id TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ip_hash TEXT,
    payload JSONB NOT NULL,
    submitted_by TEXT,
    submitter_email TEXT
);

CREATE TABLE public.forms (
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

CREATE TABLE public.kyc_documents (
    broker_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    doc_type public.public NOT NULL,
    file_path TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewed_at TEXT,
    reviewer_id TEXT,
    reviewer_notes TEXT,
    status public.public NOT NULL,
    rejection_reason TEXT,
    version NUMERIC NOT NULL
);

CREATE TABLE public.leads (
    budget_max NUMERIC,
    budget_min NUMERIC,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    email TEXT,
    full_name TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    notes TEXT,
    owner_id TEXT NOT NULL,
    phone TEXT,
    requirement TEXT,
    source public.public NOT NULL,
    status public.public NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.listing_reports (
    assigned_to TEXT,
    attachments JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    resolution_notes TEXT,
    resolved_at TEXT,
    status public.public NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.listing_status_history (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id TEXT NOT NULL,
    moderator_id TEXT,
    new_status public.public NOT NULL,
    notes TEXT,
    reason TEXT
);

CREATE TABLE public.listings (
    area_sqft NUMERIC,
    bathrooms NUMERIC,
    bedrooms NUMERIC,
    broker_id TEXT NOT NULL,
    city TEXT NOT NULL,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    featured_until TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_type public.public NOT NULL,
    locality TEXT,
    moderation_notes TEXT,
    moderation_status public.public NOT NULL,
    price NUMERIC,
    property_type public.public NOT NULL,
    status public.public NOT NULL,
    title TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.media_assets (
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

CREATE TABLE public.messages (
    body TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id TEXT NOT NULL
);

CREATE TABLE public.nav_items (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    href TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    label TEXT NOT NULL,
    location public.public NOT NULL,
    open_in_new_tab BOOLEAN NOT NULL,
    parent_id TEXT,
    position NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    visible BOOLEAN NOT NULL
);

CREATE TABLE public.notifications (
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    kind public.public NOT NULL,
    link TEXT,
    metadata JSONB NOT NULL,
    read_at TEXT,
    title TEXT NOT NULL,
    user_id TEXT NOT NULL
);

CREATE TABLE public.page_revisions (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    editor_id TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id TEXT NOT NULL,
    reason TEXT,
    snapshot JSONB NOT NULL
);

CREATE TABLE public.page_sections (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id TEXT NOT NULL,
    position NUMERIC NOT NULL,
    props JSONB NOT NULL,
    section_type TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.pages (
    author_id TEXT,
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
    parent_id TEXT,
    published_at TEXT,
    robots TEXT NOT NULL,
    scheduled_at TEXT,
    schema_jsonld JSONB,
    seo_description TEXT,
    seo_title TEXT,
    show_in_footer BOOLEAN NOT NULL,
    show_in_nav BOOLEAN NOT NULL,
    slug TEXT NOT NULL,
    status public.public NOT NULL,
    template TEXT NOT NULL,
    theme JSONB NOT NULL,
    title TEXT NOT NULL,
    twitter_card TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    visibility TEXT NOT NULL
);

CREATE TABLE public.permissions (
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource TEXT NOT NULL
);

CREATE TABLE public.profiles (
    avatar_url TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    firm TEXT,
    full_name TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    internal_notes TEXT,
    kyc_status public.public NOT NULL,
    kyc_submitted_at TEXT,
    onboarding_kyc_submitted BOOLEAN NOT NULL,
    onboarding_listing_published BOOLEAN NOT NULL,
    onboarding_network_started BOOLEAN NOT NULL,
    onboarding_profile_completed BOOLEAN NOT NULL,
    phone TEXT,
    suspended_at TEXT,
    tags JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.role_permissions (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    permission_id TEXT NOT NULL,
    role public.public NOT NULL
);

CREATE TABLE public.site_settings (
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

CREATE TABLE public.subscription_plans (
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    description TEXT,
    features JSONB NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interval TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    listing_limit NUMERIC,
    name TEXT NOT NULL,
    price_inr NUMERIC NOT NULL,
    sort_order NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    badge TEXT,
    cta_text TEXT,
    cta_url TEXT,
    trial_days NUMERIC,
    stripe_product_id TEXT,
    razorpay_plan_id TEXT,
    highlighted BOOLEAN
);

CREATE TABLE public.subscriptions (
    canceled_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    current_period_end TEXT,
    external_ref TEXT,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    status public.public NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id TEXT NOT NULL
);

CREATE TABLE public.support_attachments (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    file_path TEXT NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id TEXT NOT NULL,
    mime_type TEXT,
    size_bytes NUMERIC
);

CREATE TABLE public.support_internal_notes (
    author_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id TEXT NOT NULL
);

CREATE TABLE public.support_messages (
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    thread_id TEXT NOT NULL
);

CREATE TABLE public.support_threads (
    assigned_to TEXT,
    closed_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_message_at TEXT NOT NULL,
    opener_id TEXT NOT NULL,
    priority public.public NOT NULL,
    status public.public NOT NULL,
    subject TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE public.user_roles (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role public.public NOT NULL,
    user_id TEXT NOT NULL
);

CREATE TABLE public.webhooks (
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

ALTER TABLE public.deal_rooms ADD CONSTRAINT fk_deal_rooms_deal_id FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;
ALTER TABLE public.activities ADD CONSTRAINT fk_activities_deal_id FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;
ALTER TABLE public.activities ADD CONSTRAINT fk_activities_lead_id FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
ALTER TABLE public.blog_post_tags ADD CONSTRAINT fk_blog_post_tags_post_id FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE public.blog_post_tags ADD CONSTRAINT fk_blog_post_tags_tag_id FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;
ALTER TABLE public.blog_posts ADD CONSTRAINT fk_blog_posts_category_id FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.deals ADD CONSTRAINT fk_deals_lead_id FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
ALTER TABLE public.deals ADD CONSTRAINT fk_deals_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.form_submissions ADD CONSTRAINT fk_form_submissions_form_id FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;
ALTER TABLE public.listing_reports ADD CONSTRAINT fk_listing_reports_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.listing_status_history ADD CONSTRAINT fk_listing_status_history_listing_id FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.nav_items ADD CONSTRAINT fk_nav_items_parent_id FOREIGN KEY (parent_id) REFERENCES public.nav_items(id) ON DELETE CASCADE;
ALTER TABLE public.page_revisions ADD CONSTRAINT fk_page_revisions_page_id FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;
ALTER TABLE public.page_sections ADD CONSTRAINT fk_page_sections_page_id FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;
ALTER TABLE public.pages ADD CONSTRAINT fk_pages_parent_id FOREIGN KEY (parent_id) REFERENCES public.pages(id) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ADD CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_plan_id FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;
ALTER TABLE public.support_attachments ADD CONSTRAINT fk_support_attachments_message_id FOREIGN KEY (message_id) REFERENCES public.support_messages(id) ON DELETE CASCADE;
ALTER TABLE public.support_internal_notes ADD CONSTRAINT fk_support_internal_notes_thread_id FOREIGN KEY (thread_id) REFERENCES public.support_threads(id) ON DELETE CASCADE;
ALTER TABLE public.support_messages ADD CONSTRAINT fk_support_messages_thread_id FOREIGN KEY (thread_id) REFERENCES public.support_threads(id) ON DELETE CASCADE;
