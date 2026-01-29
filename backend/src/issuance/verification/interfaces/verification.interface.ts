export type CredentialType = 'collection' | 'delivery';

export interface CredentialVerification {
  id: string;
  credentialId: string;
  credentialType: CredentialType;
  userId?: string;
  mobileApplicationId?: string;
  verified: boolean;
  verifiedAt: Date;
  createdAt: Date;
}
