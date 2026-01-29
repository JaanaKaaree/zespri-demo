import { MATTRCredentialResponse } from '../../interfaces/mattr-api.interface';

export class DeliveryCredentialResponseDto {
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
  createdAt?: Date;
  updatedAt?: Date;
  mattrResponse?: MATTRCredentialResponse;
}
