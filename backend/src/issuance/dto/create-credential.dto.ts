import { IsString, IsObject, IsOptional, IsEmail } from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  templateId: string;

  @IsObject()
  credentialData: Record<string, any>;

  @IsOptional()
  @IsString()
  recipientDid?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;
}
