import { IsString } from 'class-validator';

export class IssueCredentialDto {
  @IsString()
  credentialId: string;
}
