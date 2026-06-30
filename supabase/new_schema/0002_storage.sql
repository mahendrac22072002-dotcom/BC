-- 0002_storage.sql
-- Storage Buckets Configuration for BrokerConnect

INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('listing-images', 'listing-images', true),
('kyc', 'kyc', false),
('deal-files', 'deal-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Avatars (Public Read, Owner Write)
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Owner Write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Listing Images (Public Read, Broker Write)
CREATE POLICY "Listing Images Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Listing Images Broker Write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'listing-images' AND 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('broker', 'admin', 'staff'))
);

-- KYC (Staff Read, Owner Write)
CREATE POLICY "KYC Owner Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "KYC Staff Read" ON storage.objects FOR SELECT USING (bucket_id = 'kyc' AND public.is_staff());

-- Deal Files (Room Members Read/Write)
CREATE POLICY "Deal Files Member Access" ON storage.objects FOR SELECT USING (
  bucket_id = 'deal-files' AND 
  (EXISTS (SELECT 1 FROM public.deal_room_members drm WHERE drm.user_id = auth.uid() AND drm.room_id::text = (storage.foldername(name))[1]) OR public.is_staff())
);
CREATE POLICY "Deal Files Member Write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'deal-files' AND 
  (EXISTS (SELECT 1 FROM public.deal_room_members drm WHERE drm.user_id = auth.uid() AND drm.room_id::text = (storage.foldername(name))[1]) OR public.is_staff())
);
