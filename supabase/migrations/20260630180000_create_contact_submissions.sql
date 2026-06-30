CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    subject text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    assigned_to uuid REFERENCES auth.users(id),
    notes text
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact submissions"
    ON public.contact_submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Only staff can view contact submissions"
    ON public.contact_submissions
    FOR SELECT
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM staff_roles
  WHERE (staff_roles.user_id = auth.uid()))));

CREATE POLICY "Only staff can update contact submissions"
    ON public.contact_submissions
    FOR UPDATE
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM staff_roles
  WHERE (staff_roles.user_id = auth.uid()))));

CREATE POLICY "Only staff can delete contact submissions"
    ON public.contact_submissions
    FOR DELETE
    TO authenticated
    USING ((EXISTS ( SELECT 1
   FROM staff_roles
  WHERE (staff_roles.user_id = auth.uid()))));
