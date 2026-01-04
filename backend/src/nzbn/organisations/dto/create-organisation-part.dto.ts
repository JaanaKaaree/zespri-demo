import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
  IsString,
  IsArray,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OrganisationPart,
  OrganisationPartFunction,
  OrganisationPartStatus,
  Privacy,
  OrganisationPartPurposeType,
  OrganisationPartAddressType,
  OrganisationPartEmailPurposeType,
} from '../interfaces/nzbn-api.interface';

class OrganisationPartPurposeDto {
  @IsOptional()
  @IsString()
  uniqueIdentifier?: string;

  @IsEnum(OrganisationPartPurposeType)
  purpose: OrganisationPartPurposeType;

  @IsOptional()
  @IsString()
  purposeDescription?: string;
}

class OrganisationPartAddressDto {
  @IsOptional()
  @IsString()
  uniqueIdentifier?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  careOf?: string;

  @IsOptional()
  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsOptional()
  @IsString()
  address3?: string;

  @IsOptional()
  @IsString()
  address4?: string;

  @IsOptional()
  @IsString()
  postCode?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsEnum(OrganisationPartAddressType)
  addressType?: OrganisationPartAddressType;

  @IsOptional()
  @IsString()
  pafId?: string;
}

class OrganisationPartPhoneNumberDto {
  @IsOptional()
  @IsString()
  uniqueIdentifier?: string;

  @IsOptional()
  @IsString()
  phonePurpose?: string;

  @IsOptional()
  @IsString()
  phonePurposeDescription?: string;

  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @IsOptional()
  @IsString()
  phoneAreaCode?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

class OrganisationPartEmailDto {
  @IsOptional()
  @IsString()
  uniqueIdentifier?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsEnum(OrganisationPartEmailPurposeType)
  emailPurpose?: OrganisationPartEmailPurposeType;

  @IsOptional()
  @IsString()
  emailPurposeDescription?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

class OrganisationPartMetadataDto {
  @IsOptional()
  @IsString()
  uniqueIdentifier?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

class OrganisationPartNzbnListItemDto {
  @IsString()
  nzbn: string;
}

class OrganisationPartDataDto {
  @IsOptional()
  @IsString()
  opn?: string;

  @IsOptional()
  @IsString()
  parentNzbn?: string;

  @IsOptional()
  @IsString()
  parentNzbnName?: string;

  @IsOptional()
  @IsString()
  parentGln?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationPartPurposeDto)
  purposes?: OrganisationPartPurposeDto[];

  @IsOptional()
  @IsEnum(OrganisationPartFunction)
  function?: OrganisationPartFunction;

  @IsOptional()
  @IsEnum(OrganisationPartStatus)
  organisationPartStatus?: OrganisationPartStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationPartAddressDto)
  addresses?: OrganisationPartAddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationPartPhoneNumberDto)
  phoneNumbers?: OrganisationPartPhoneNumberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationPartEmailDto)
  emailAddresses?: OrganisationPartEmailDto[];

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  paymentBankAccountNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationPartMetadataDto)
  'custom-data'?: OrganisationPartMetadataDto[];

  @IsOptional()
  @IsEnum(Privacy)
  privacy?: Privacy;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationPartNzbnListItemDto)
  'nzbn-list'?: OrganisationPartNzbnListItemDto[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  statusDate?: string;
}

export class CreateOrganisationPartDto {
  @IsBoolean()
  termsAndConditionsAccepted: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => OrganisationPartDataDto)
  organisationPart: OrganisationPartDataDto;
}
