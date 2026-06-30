-- Add rejection_reason, version, and uploaded_at (alias to created_at logic) to kyc_documents
ALTER TABLE public.kyc_documents
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1;

-- If needed, add staff update policy to kyc_documents
DROP POLICY IF EXISTS "Staff update KYC docs" ON public.kyc_documents;
CREATE POLICY "Staff update KYC docs"
  ON public.kyc_documents FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::public.app_role));
