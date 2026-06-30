-- If the contact_submissions table does not exist on your remote database, run this:
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS so anonymous users can insert, but only admins can read/update
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (for the contact page)
DROP POLICY IF EXISTS "Enable insert for public" ON public.contact_submissions;
CREATE POLICY "Enable insert for public" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

-- Allow admins/staff to read
DROP POLICY IF EXISTS "Enable read for staff" ON public.contact_submissions;
CREATE POLICY "Enable read for staff" ON public.contact_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('admin', 'super_admin', 'staff')
        )
    );

-- Allow admins/staff to update
DROP POLICY IF EXISTS "Enable update for staff" ON public.contact_submissions;
CREATE POLICY "Enable update for staff" ON public.contact_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('admin', 'super_admin', 'staff')
        )
    );

-- CRITICAL: Reload the PostgREST schema cache so the frontend can see the table
NOTIFY pgrst, 'reload schema';
