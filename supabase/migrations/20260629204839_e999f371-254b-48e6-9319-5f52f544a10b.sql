
-- Fix RLS function permissions
GRANT EXECUTE ON FUNCTION private.is_verified(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- Add new KYC document types for brokers
ALTER TYPE public.kyc_doc_type ADD VALUE IF NOT EXISTS 'broker_photo';
ALTER TYPE public.kyc_doc_type ADD VALUE IF NOT EXISTS 'visiting_card';
ALTER TYPE public.kyc_doc_type ADD VALUE IF NOT EXISTS 'office_photo';
