export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface CreateCredentialRequest {
  templateId: string;
  credentialData: Record<string, any>;
  recipientDid?: string;
  recipientEmail?: string;
}

export interface CredentialResponse {
  id: string;
  status: string;
  credentialId?: string;
  issuanceUrl?: string;
  error?: string;
}

export interface CredentialStatus {
  id: string;
  status: 'pending' | 'issued' | 'failed';
  credentialId?: string;
  error?: string;
}
