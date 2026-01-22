import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  ValidateIf,
  IsDateString,
} from 'class-validator';

export class CreateCollectionCredentialDto {
  @IsString()
  binIdentifier: string;

  @IsString()
  rowIdentifier: string;

  @IsDateString()
  harvestStartDatetime: string;

  @IsOptional()
  @IsDateString()
  harvestEndDatetime?: string;

  @IsString()
  pickerId: string;

  @IsString()
  pickerName: string;

  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'NZBN must be exactly 13 digits',
  })
  nzbn: string;

  @IsString()
  orchardId: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

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
