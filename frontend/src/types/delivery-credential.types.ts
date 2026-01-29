export interface DeliveryCredential {
  id: string;
  deliveryId: string;
  originAddress: string;
  destinationAddress: string;
  deliveryStartDatetime: string;
  deliveryEndDatetime?: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  collectionId?: string;
  nzbn: string;
  recipientDid?: string;
  recipientEmail?: string;
  status: 'pending' | 'issued' | 'failed';
  credentialId?: string;
  issuanceUrl?: string;
  qrCode?: {
    qrcode: string; // Base64 encoded QR code image
    type?: string; // Image type (e.g., "image/png")
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
  mattrResponse?: {
    id: string;
    status: string;
    credentialId?: string;
    issuanceUrl?: string;
    error?: string;
  };
}

export interface CreateDeliveryCredentialRequest {
  originAddress: string;
  destinationAddress: string;
  deliveryStartDatetime: string;
  deliveryEndDatetime?: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  collectionId?: string;
  nzbn: string;
  deliveryId?: string;
  recipientDid?: string;
  recipientEmail?: string;
  sessionId?: string;
}

export interface UpdateDeliveryCredentialRequest {
  deliveryEndDatetime?: string;
  recipientDid?: string;
  recipientEmail?: string;
}

export interface DeliveryCredentialFormData {
  originAddress: string;
  destinationAddress: string;
  deliveryStartDatetime: string;
  deliveryEndDatetime?: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  collectionId?: string;
  nzbn: string;
  recipientDid?: string;
  recipientEmail?: string;
  selectedOrganisationPart?: {
    opn: string;
    name?: string;
    nzbn: string;
    orchardId?: string;
  };
  selectedCollectionCredential?: {
    id: string;
    collectionId: string;
    binIdentifier?: string;
    rowIdentifier?: string;
  };
}

export interface DeliveryCredentialFilters {
  nzbn?: string;
  driverId?: string;
  vehicleId?: string;
  collectionId?: string;
  status?: 'pending' | 'issued' | 'failed';
  startDate?: string;
  endDate?: string;
}
