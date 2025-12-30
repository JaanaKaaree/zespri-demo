export interface MATTRCredentialRequest {
  templateId: string;
  credentialData: Record<string, any>;
  recipientDid?: string;
  recipientEmail?: string;
}

export interface MATTRCredentialResponse {
  id: string;
  status: string;
  credentialId?: string;
  issuanceUrl?: string;
  error?: string;
}

export interface MATTRCredentialStatus {
  id: string;
  status: 'pending' | 'issued' | 'failed';
  credentialId?: string;
  error?: string;
}
