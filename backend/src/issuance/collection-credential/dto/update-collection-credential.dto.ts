import { IsOptional, IsDateString, IsString } from 'class-validator';

export class UpdateCollectionCredentialDto {
  @IsOptional()
  @IsDateString()
  harvestEndDatetime?: string;

  @IsOptional()
  @IsString()
  recipientDid?: string;

  @IsOptional()
  @IsString()
  recipientEmail?: string;
}
