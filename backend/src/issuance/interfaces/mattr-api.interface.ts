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
  // CWT format fields (from /v2/credentials/compact/sign endpoint)
  encoded?: string; // CWT credential in compact format (CSC:...)
  decoded?: any; // Decoded credential data
  credential?: string; // Alias for encoded (for backward compatibility)
}

export interface MATTRQRCodeResponse {
  qrcode: string; // Base64 encoded QR code image
  type?: string; // Image type (e.g., "image/png")
}

export interface MATTRCredentialStatus {
  id: string;
  status: 'pending' | 'issued' | 'failed' | 'revoked';
  credentialId?: string;
  error?: string;
}

export interface MATTRVerifyRequest {
  payload: string;
  trustedIssuers: string[];
  assertValidFrom?: boolean;
  assertValidUntil?: boolean;
  checkRevocation?: boolean;
}

export interface MATTRVerifyResponse {
  verified: boolean;
  decoded?: any; // The decoded credential data (claims)
  payload?: any; // Alternative field name (for compatibility)
  errors?: string[];
  warnings?: string[];
}
