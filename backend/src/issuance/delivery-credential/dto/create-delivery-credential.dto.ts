import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  IsDateString,
} from 'class-validator';

export class CreateDeliveryCredentialDto {
  @IsString()
  originAddress: string;

  @IsString()
  destinationAddress: string;

  @IsDateString()
  deliveryStartDatetime: string;

  @IsOptional()
  @IsDateString()
  deliveryEndDatetime?: string;

  @IsString()
  driverId: string;

  @IsString()
  driverName: string;

  @IsString()
  vehicleId: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'NZBN must be exactly 13 digits',
  })
  nzbn: string;

  @IsOptional()
  @IsString()
  deliveryId?: string;

  @IsOptional()
  @IsString()
  recipientDid?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  sessionId?: string; // For OAuth token retrieval when validating organization parts
}
