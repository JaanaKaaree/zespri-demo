import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RevokeCredentialDto {
  @IsString()
  @IsNotEmpty()
  payload: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  mobile_application_id?: string;

  @IsOptional()
  @IsString()
  credential_type?: string; // 'DeliveryCredential' or 'OrgPartHarvestCredential'
}
