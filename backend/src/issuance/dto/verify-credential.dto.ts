import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyCredentialDto {
  @IsString()
  @IsNotEmpty()
  payload: string;
}
