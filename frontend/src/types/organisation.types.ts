export interface OrganisationPart {
  opn?: string;
  parentNzbn?: string;
  parentNzbnName?: string;
  parentGln?: string;
  name?: string;
  purposes?: OrganisationPartPurpose[];
  function?: OrganisationPartFunction;
  organisationPartStatus?: OrganisationPartStatus;
  addresses?: OrganisationPartAddress[];
  phoneNumbers?: OrganisationPartPhoneNumber[];
  emailAddresses?: OrganisationPartEmail[];
  gstNumber?: string;
  paymentBankAccountNumber?: string;
  'custom-data'?: OrganisationPartMetadata[];
  privacy?: Privacy;
  'nzbn-list'?: OrganisationPartNzbnListItem[];
  startDate?: string;
  statusDate?: string;
}

export interface OrganisationPartPurpose {
  uniqueIdentifier?: string;
  purpose: OrganisationPartPurposeType;
  purposeDescription?: string;
}

export interface OrganisationPartAddress {
  uniqueIdentifier?: string;
  startDate?: string;
  careOf?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  address4?: string;
  postCode?: string;
  countryCode?: string;
  addressType?: OrganisationPartAddressType;
  pafId?: string;
}

export interface OrganisationPartPhoneNumber {
  uniqueIdentifier?: string;
  phonePurpose?: string;
  phonePurposeDescription?: string;
  phoneCountryCode?: string;
  phoneAreaCode?: string;
  phoneNumber?: string;
  startDate?: string;
}

export interface OrganisationPartEmail {
  uniqueIdentifier?: string;
  emailAddress?: string;
  emailPurpose?: OrganisationPartEmailPurposeType;
  emailPurposeDescription?: string;
  startDate?: string;
}

export interface OrganisationPartMetadata {
  uniqueIdentifier?: string;
  key?: string;
  value?: string;
  startDate?: string;
}

export interface OrganisationPartNzbnListItem {
  nzbn: string;
}

export type OrganisationPartFunction = 'FUNCTION' | 'PHYSICAL_LOCATION' | 'DIGITAL_LOCATION';
export type OrganisationPartStatus = 'ACTIVE' | 'INACTIVE';
export type Privacy = 'PUBLIC' | 'SHARED' | 'PRIVATE';
export type OrganisationPartPurposeType = 'E_INVOICING' | 'OTHER' | 'LOCATIONARRIVAL';
export type OrganisationPartAddressType = 'POSTAL' | 'PHYSICAL' | 'DELIVERY' | 'INVOICE';
export type OrganisationPartEmailPurposeType = 'INVOICE_ADDRESS' | 'OTHER';

export interface CreateOrganisationPartRequest {
  termsAndConditionsAccepted: boolean;
  organisationPart: OrganisationPart;
}

export interface UpdateOrganisationPartRequest extends OrganisationPart {}
