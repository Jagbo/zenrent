export interface TenantDocument {
  id: string;
  tenant_id: string;
  document_type: string;
  document_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  description?: string;
  metadata?: {
    original_name: string;
    content_type: string;
    storage_path: string;
    [key: string]: any;
  };
}

export interface DocumentUploadData {
  file: File;
  tenantId: string;
  documentType: string;
  description?: string;
}

export const DOCUMENT_TYPES = {
  LEASE_AGREEMENT: 'lease_agreement',
  TENANT_APPLICATION: 'tenant_application',
  ID_DOCUMENT: 'id_document',
  PROOF_OF_INCOME: 'proof_of_income',
  REFERENCE_LETTER: 'reference_letter',
  BANK_STATEMENT: 'bank_statement',
  EMPLOYMENT_LETTER: 'employment_letter',
  CREDIT_REPORT: 'credit_report',
  INSURANCE_DOCUMENT: 'insurance_document',
  OTHER: 'other'
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DOCUMENT_TYPES.LEASE_AGREEMENT]: 'Lease Agreement',
  [DOCUMENT_TYPES.TENANT_APPLICATION]: 'Tenant Application',
  [DOCUMENT_TYPES.ID_DOCUMENT]: 'ID Document',
  [DOCUMENT_TYPES.PROOF_OF_INCOME]: 'Proof of Income',
  [DOCUMENT_TYPES.REFERENCE_LETTER]: 'Reference Letter',
  [DOCUMENT_TYPES.BANK_STATEMENT]: 'Bank Statement',
  [DOCUMENT_TYPES.EMPLOYMENT_LETTER]: 'Employment Letter',
  [DOCUMENT_TYPES.CREDIT_REPORT]: 'Credit Report',
  [DOCUMENT_TYPES.INSURANCE_DOCUMENT]: 'Insurance Document',
  [DOCUMENT_TYPES.OTHER]: 'Other'
}; 