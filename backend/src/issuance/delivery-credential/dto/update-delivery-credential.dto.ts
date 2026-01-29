import { IsOptional, IsDateString, IsString } from 'class-validator';

export class UpdateDeliveryCredentialDto {
  @IsOptional()
  @IsDateString()
  deliveryEndDatetime?: string;

  @IsOptional()
  @IsString()
  recipientDid?: string;

  @IsOptional()
  @IsString()
  recipientEmail?: string;
}
