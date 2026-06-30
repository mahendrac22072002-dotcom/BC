
-- MEDIA LIBRARY TABLE
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  width int,
  height int,
  alt_text text,
  folder text NOT NULL DEFAULT 'uploads',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media read auth" ON public.media_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "media insert staff" ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "media update staff" ON public.media_assets FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "media delete staff" ON public.media_assets FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_media_assets_touch BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- STORAGE POLICIES for 'media' bucket
CREATE POLICY "media bucket read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media');
CREATE POLICY "media bucket write staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')));
CREATE POLICY "media bucket delete staff" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin')));

-- NAVIGATION
CREATE TYPE public.nav_location AS ENUM ('header','footer');
CREATE TABLE public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location public.nav_location NOT NULL DEFAULT 'header',
  label text NOT NULL,
  href text NOT NULL,
  parent_id uuid REFERENCES public.nav_items(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  open_in_new_tab boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nav public read" ON public.nav_items FOR SELECT USING (true);
CREATE POLICY "nav insert staff" ON public.nav_items FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "nav update staff" ON public.nav_items FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "nav delete staff" ON public.nav_items FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_nav_items_touch BEFORE UPDATE ON public.nav_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.nav_items (location,label,href,position) VALUES
  ('header','Pricing','/pricing',10),
  ('header','About','/about',20),
  ('header','Blog','/blog',30),
  ('header','Contact','/contact',40),
  ('footer','Privacy','/privacy',10),
  ('footer','Terms','/terms',20),
  ('footer','Contact','/contact',30);

-- FORMS
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  notify_email text,
  success_message text NOT NULL DEFAULT 'Thanks — we received your submission.',
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT ALL ON public.forms TO service_role;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forms read published" ON public.forms FOR SELECT
  USING (published = true OR private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "forms insert staff" ON public.forms FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "forms update staff" ON public.forms FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "forms delete admin" ON public.forms FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_forms_touch BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitter_email text,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.form_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submissions TO authenticated;
GRANT ALL ON public.form_submissions TO service_role;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submission insert public" ON public.form_submissions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.published = true));
CREATE POLICY "submission read staff" ON public.form_submissions FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'staff') OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "submission delete admin" ON public.form_submissions FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'));

INSERT INTO public.forms (slug,name,description,schema,published,success_message) VALUES
  ('contact','Contact','Public contact form embedded on the contact page.',
   '[{"key":"name","label":"Name","type":"text","required":true},{"key":"email","label":"Email","type":"email","required":true},{"key":"message","label":"Message","type":"textarea","required":true}]'::jsonb,
   true,'Thanks — we will get back to you within one business day.');

-- PERMISSIONS
INSERT INTO public.permissions (resource, action, description) VALUES
  ('media','read','View media library'),
  ('media','write','Upload and edit media'),
  ('media','delete','Delete media assets'),
  ('navigation','manage','Edit public site navigation'),
  ('forms','manage','Create and edit forms'),
  ('forms','read_submissions','View form submissions')
ON CONFLICT (resource,action) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
WHERE (resource,action) IN (
  ('media','read'),('media','write'),('media','delete'),
  ('navigation','manage'),('forms','manage'),('forms','read_submissions'))
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'staff'::app_role, id FROM public.permissions
WHERE (resource,action) IN (
  ('media','read'),('media','write'),
  ('forms','manage'),('forms','read_submissions'))
ON CONFLICT DO NOTHING;
