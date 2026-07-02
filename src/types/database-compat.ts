// TEMPORARY
// Remove after official Supabase types are regenerated.

import { Database as OriginalDatabase } from '@/integrations/supabase/types';

export type Database = OriginalDatabase;

// TEMPORARY OVERRIDES
export type ListingRow = OriginalDatabase['public']['Tables']['listings']['Row'] & {
  property_type: string;
};

export type ListingInsert = OriginalDatabase['public']['Tables']['listings']['Insert'] & {
  property_type?: string;
};

export type KycDocumentRow = Omit<OriginalDatabase['public']['Tables']['kyc_documents']['Row'], 'document_type'> & {
  doc_type: OriginalDatabase['public']['Tables']['kyc_documents']['Row']['document_type'];
};

export type KycDocumentInsert = Omit<OriginalDatabase['public']['Tables']['kyc_documents']['Insert'], 'document_type'> & {
  doc_type: OriginalDatabase['public']['Tables']['kyc_documents']['Row']['document_type'];
};


