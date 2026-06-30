-- Add view_sensitive permission for KYC documents and grant to admin only.
INSERT INTO public.permissions (resource, action, description)
VALUES ('kyc.documents', 'view_sensitive', 'Open original KYC documents (unmasked)')
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
WHERE resource = 'kyc.documents' AND action = 'view_sensitive'
ON CONFLICT DO NOTHING;

-- Also grant broker.view_pii to admin so we can branch UI on it.
INSERT INTO public.permissions (resource, action, description)
VALUES ('broker', 'view_pii', 'See unmasked broker PII (name, email, phone, address)')
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
WHERE resource = 'broker' AND action = 'view_pii'
ON CONFLICT DO NOTHING;