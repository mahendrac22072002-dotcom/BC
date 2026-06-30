-- Migration: 0007_fix_kyc_infrastructure
-- Purpose: Add 'uploaded' to the allowed KYC statuses to match the frontend expectations.
-- Preconditions:
--   kyc_documents table exists
-- Postconditions:
--   kyc_documents.status allows 'uploaded'

BEGIN;

DO $$ 
DECLARE
  con_name TEXT;
BEGIN
  -- Find the auto-generated check constraint name for the status column
  SELECT con.conname INTO con_name
  FROM pg_constraint con
  INNER JOIN pg_class rel ON rel.oid = con.conrelid
  INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  INNER JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'kyc_documents'
    AND att.attname = 'status'
    AND con.contype = 'c';

  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.kyc_documents DROP CONSTRAINT ' || quote_ident(con_name);
  END IF;

  -- Add the new constraint
  ALTER TABLE public.kyc_documents ADD CONSTRAINT kyc_documents_status_check 
    CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected'));
END $$;

-- Verify
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kyc_documents_status_check'
  ) THEN
    RAISE EXCEPTION 'Verification failed: kyc_documents_status_check constraint not found';
  END IF;
END $$;

COMMIT;
