export interface CollectionCredential {
  id: string;
  collectionId: string;
  binIdentifier: string;
  rowIdentifier: string;
  harvestStartDatetime: string;
  harvestEndDatetime?: string;
  pickerId: string;
  pickerName: string;
  nzbn: string;
  orchardId: string;
  recipientDid?: string;
  recipientEmail?: string;
  status: 'pending' | 'issued' | 'failed';
  credentialId?: string;
  issuanceUrl?: string;
  qrCode?: {
    qrcode: string; // Base64 encoded QR code image
    type?: string; // Image type (e.g., "image/png")
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCredentialFilters {
  nzbn?: string;
  orchardId?: string;
  pickerId?: string;
  status?: 'pending' | 'issued' | 'failed';
  startDate?: string;
  endDate?: string;
}
