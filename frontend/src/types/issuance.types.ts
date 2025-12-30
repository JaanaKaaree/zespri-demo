export interface Credential {
  id: string;
  status: 'pending' | 'issued' | 'failed';
  credentialId?: string;
  issuanceUrl?: string;
  templateId?: string;
  credentialData?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CredentialFormData {
  templateId: string;
  credentialData: Record<string, any>;
  recipientDid?: string;
  recipientEmail?: string;
}
