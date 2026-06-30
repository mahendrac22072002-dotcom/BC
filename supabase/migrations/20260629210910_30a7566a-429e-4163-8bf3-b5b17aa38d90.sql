
-- =========================================================================
-- PERMISSIONS
-- =========================================================================
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource, action)
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read permissions" ON public.permissions
  FOR SELECT TO authenticated USING (true);

-- =========================================================================
-- ROLE -> PERMISSIONS
-- =========================================================================
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- has_permission HELPER
-- =========================================================================
CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _resource text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.resource = _resource
      AND p.action = _action
  );
$$;
REVOKE EXECUTE ON FUNCTION private.has_permission(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text, text) TO authenticated;

-- Public wrapper so the client can call .rpc('has_permission', ...)
CREATE OR REPLACE FUNCTION public.has_permission(_resource text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.has_permission(auth.uid(), _resource, _action);
$$;
GRANT EXECUTE ON FUNCTION public.has_permission(text, text) TO authenticated;

-- =========================================================================
-- AUDIT LOG (append-only)
-- =========================================================================
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  before jsonb,
  after jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admins read audit" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff and admins write audit" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff'))
  );

CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log (actor_id);
CREATE INDEX admin_audit_log_resource_idx ON public.admin_audit_log (resource, resource_id);

-- =========================================================================
-- SITE SETTINGS (singleton)
-- =========================================================================
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  brand_name text NOT NULL DEFAULT 'BrokersConnect',
  support_email text,
  contact_phone text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  footer_html text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads site_settings" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins write site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (singleton, brand_name) VALUES (true, 'BrokersConnect')
  ON CONFLICT (singleton) DO NOTHING;

-- =========================================================================
-- PROFILES EXTENSIONS
-- =========================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

-- =========================================================================
-- LISTINGS EXTENSIONS
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE public.listing_moderation_status AS ENUM ('pending','approved','rejected','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS moderation_status public.listing_moderation_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_notes text,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- =========================================================================
-- SEED DEFAULT PERMISSIONS
-- =========================================================================
INSERT INTO public.permissions (resource, action, description) VALUES
  ('dashboard','view','View admin dashboard'),
  ('users','view','View admin and staff users'),
  ('users','invite','Invite admin or staff users'),
  ('users','update','Update admin/staff users'),
  ('users','delete','Remove admin/staff access'),
  ('roles','view','View roles and permissions'),
  ('roles','update','Modify role permissions'),
  ('brokers','view','View brokers'),
  ('brokers','update','Update broker records'),
  ('brokers','suspend','Suspend or unsuspend brokers'),
  ('brokers','delete','Delete brokers'),
  ('kyc','view','View KYC submissions'),
  ('kyc','approve','Approve KYC submissions'),
  ('kyc','reject','Reject KYC submissions'),
  ('listings','view','View listings'),
  ('listings','approve','Approve listings'),
  ('listings','reject','Reject listings'),
  ('listings','feature','Feature listings'),
  ('listings','delete','Delete listings'),
  ('settings','view','View site settings'),
  ('settings','update','Update site settings'),
  ('audit','view','View audit logs')
ON CONFLICT (resource, action) DO NOTHING;

-- Admin: all permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::public.app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Staff: view + moderate (no destructive)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'staff'::public.app_role, id FROM public.permissions
WHERE (resource, action) IN (
  ('dashboard','view'),
  ('brokers','view'),('brokers','update'),('brokers','suspend'),
  ('kyc','view'),('kyc','approve'),('kyc','reject'),
  ('listings','view'),('listings','approve'),('listings','reject'),('listings','feature'),
  ('settings','view'),
  ('audit','view'),
  ('users','view'),
  ('roles','view')
)
ON CONFLICT DO NOTHING;
