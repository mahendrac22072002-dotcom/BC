
-- =========================================================
-- ENUMS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.listing_report_status AS ENUM ('open','assigned','resolved','dismissed','escalated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.page_status AS ENUM ('draft','published','scheduled','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_status AS ENUM ('draft','scheduled','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_status AS ENUM ('open','pending','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.support_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_kind AS ENUM (
    'kyc_approved','kyc_rejected',
    'listing_approved','listing_rejected','listing_hidden','listing_featured',
    'support_reply','subscription_expiring','system_announcement','report_update'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend listing moderation status values used by staff actions
DO $$ BEGIN
  ALTER TYPE public.listing_moderation_status ADD VALUE IF NOT EXISTS 'changes_requested';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.listing_moderation_status ADD VALUE IF NOT EXISTS 'hidden';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- LISTING STATUS HISTORY (append-only)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.listing_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  moderator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status public.listing_moderation_status,
  new_status public.listing_moderation_status NOT NULL,
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lsh_listing ON public.listing_status_history(listing_id, created_at DESC);
GRANT SELECT, INSERT ON public.listing_status_history TO authenticated;
GRANT ALL ON public.listing_status_history TO service_role;
ALTER TABLE public.listing_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers view own listing history" ON public.listing_status_history
  FOR SELECT TO authenticated USING (
    EXISTS(SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.broker_id = auth.uid())
  );
CREATE POLICY "Staff view all listing history" ON public.listing_status_history
  FOR SELECT TO authenticated USING (
    private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Staff insert listing history" ON public.listing_status_history
  FOR INSERT TO authenticated WITH CHECK (
    moderator_id = auth.uid()
    AND (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'))
  );

-- =========================================================
-- LISTING REPORTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.listing_report_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.listing_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON public.listing_reports(listing_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_reports TO authenticated;
GRANT ALL ON public.listing_reports TO service_role;
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_reports_touch BEFORE UPDATE ON public.listing_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Reporters view own reports" ON public.listing_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "Reporters create reports" ON public.listing_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Staff view all reports" ON public.listing_reports
  FOR SELECT TO authenticated USING (
    private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Staff update reports" ON public.listing_reports
  FOR UPDATE TO authenticated USING (
    private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
  ) WITH CHECK (
    private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Admins delete reports" ON public.listing_reports
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));

-- =========================================================
-- CMS: PAGES, PAGE SECTIONS, REVISIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status public.page_status NOT NULL DEFAULT 'draft',
  seo_title text,
  seo_description text,
  template text NOT NULL DEFAULT 'default',
  page_type text NOT NULL DEFAULT 'marketing',
  body text,
  scheduled_at timestamptz,
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT SELECT ON public.pages TO anon;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pages_touch BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Public can read published pages" ON public.pages
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins manage all pages" ON public.pages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sections_page ON public.page_sections(page_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT SELECT ON public.page_sections TO anon;
GRANT ALL ON public.page_sections TO service_role;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sections_touch BEFORE UPDATE ON public.page_sections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Public read sections of published pages" ON public.page_sections
  FOR SELECT TO anon, authenticated USING (
    EXISTS(SELECT 1 FROM public.pages p WHERE p.id = page_id AND p.status = 'published')
  );
CREATE POLICY "Admins manage sections" ON public.page_sections
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  editor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  snapshot jsonb NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revisions_page ON public.page_revisions(page_id, created_at DESC);
GRANT SELECT, INSERT ON public.page_revisions TO authenticated;
GRANT ALL ON public.page_revisions TO service_role;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view revisions" ON public.page_revisions
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert revisions" ON public.page_revisions
  FOR INSERT TO authenticated WITH CHECK (
    editor_id = auth.uid() AND private.has_role(auth.uid(),'admin')
  );

-- =========================================================
-- BLOG
-- =========================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.blog_categories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_tags TO authenticated;
GRANT ALL ON public.blog_tags TO service_role;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tags" ON public.blog_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage tags" ON public.blog_tags FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL DEFAULT '',
  cover_url text,
  status public.blog_status NOT NULL DEFAULT 'draft',
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reading_minutes integer NOT NULL DEFAULT 1,
  seo_title text,
  seo_description text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.blog_posts(status, published_at DESC);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_posts_touch BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.blog_post_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_tags TO authenticated;
GRANT ALL ON public.blog_post_tags TO service_role;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read post tags" ON public.blog_post_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage post tags" ON public.blog_post_tags FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

-- =========================================================
-- SUPPORT CENTER
-- =========================================================
CREATE TABLE IF NOT EXISTS public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opener_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status public.support_status NOT NULL DEFAULT 'open',
  priority public.support_priority NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_threads_status ON public.support_threads(status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_opener ON public.support_threads(opener_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_threads_touch BEFORE UPDATE ON public.support_threads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Opener views own threads" ON public.support_threads FOR SELECT TO authenticated USING (opener_id = auth.uid());
CREATE POLICY "Opener creates own threads" ON public.support_threads FOR INSERT TO authenticated WITH CHECK (opener_id = auth.uid());
CREATE POLICY "Opener updates own thread" ON public.support_threads FOR UPDATE TO authenticated
  USING (opener_id = auth.uid()) WITH CHECK (opener_id = auth.uid());
CREATE POLICY "Staff view all threads" ON public.support_threads FOR SELECT TO authenticated USING (
  private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
);
CREATE POLICY "Staff update threads" ON public.support_threads FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete threads" ON public.support_threads FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msgs_thread ON public.support_messages(thread_id, created_at);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread participants read messages" ON public.support_messages FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND t.opener_id = auth.uid())
  OR private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
);
CREATE POLICY "Thread participants insert messages" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS(SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND t.opener_id = auth.uid())
    OR private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
  )
);

-- Bump thread last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_support_thread_last_message()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.support_threads SET last_message_at = NEW.created_at, status = CASE
    WHEN status = 'closed' THEN 'open' ELSE status END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_bump_support_thread ON public.support_messages;
CREATE TRIGGER trg_bump_support_thread AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_support_thread_last_message();

CREATE TABLE IF NOT EXISTS public.support_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  mime_type text,
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.support_attachments TO authenticated;
GRANT ALL ON public.support_attachments TO service_role;
ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read attachments if thread visible" ON public.support_attachments FOR SELECT TO authenticated USING (
  EXISTS(
    SELECT 1 FROM public.support_messages m
    JOIN public.support_threads t ON t.id = m.thread_id
    WHERE m.id = message_id AND (
      t.opener_id = auth.uid()
      OR private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
    )
  )
);
CREATE POLICY "Insert attachments if can post in thread" ON public.support_attachments FOR INSERT TO authenticated WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.support_messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.support_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_thread ON public.support_internal_notes(thread_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.support_internal_notes TO authenticated;
GRANT ALL ON public.support_internal_notes TO service_role;
ALTER TABLE public.support_internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read internal notes" ON public.support_internal_notes FOR SELECT TO authenticated USING (
  private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
);
CREATE POLICY "Staff write internal notes" ON public.support_internal_notes FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'))
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notif_user_all ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')
);

-- =========================================================
-- PERMISSION SEEDS
-- =========================================================
INSERT INTO public.permissions (resource, action, description) VALUES
  ('listings','moderate','Approve, reject, request changes on listings'),
  ('listings','hide','Hide listings'),
  ('listings','history','View listing moderation history'),
  ('reports','view','View listing reports'),
  ('reports','assign','Assign reports to staff'),
  ('reports','resolve','Resolve or dismiss reports'),
  ('reports','delete','Delete reports'),
  ('cms.pages','manage','Create and edit CMS pages'),
  ('cms.posts','manage','Create and edit blog posts'),
  ('cms','publish','Publish CMS content'),
  ('support','view','View support tickets'),
  ('support','reply','Reply to support tickets'),
  ('support','assign','Assign support tickets'),
  ('support','close','Close support tickets'),
  ('support','internal_notes','Read and write internal staff notes'),
  ('notifications','broadcast','Send system announcements')
ON CONFLICT (resource, action) DO NOTHING;

-- Grant staff operational permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'staff'::app_role, p.id FROM public.permissions p
WHERE (p.resource, p.action) IN (
  ('listings','moderate'),('listings','hide'),('listings','history'),
  ('reports','view'),('reports','assign'),('reports','resolve'),
  ('support','view'),('support','reply'),('support','assign'),('support','close'),('support','internal_notes')
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant admin every permission
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, p.id FROM public.permissions p
ON CONFLICT (role, permission_id) DO NOTHING;
