export enum OrganisationPartFunction {
  FUNCTION = 'FUNCTION',
  PHYSICAL_LOCATION = 'PHYSICAL_LOCATION',
  DIGITAL_LOCATION = 'DIGITAL_LOCATION',
}

export enum OrganisationPartStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum Privacy {
  PUBLIC = 'PUBLIC',
  SHARED = 'SHARED',
  PRIVATE = 'PRIVATE',
}

export enum OrganisationPartPurposeType {
  E_INVOICING = 'E_INVOICING',
  OTHER = 'OTHER',
  LOCATIONARRIVAL = 'LOCATIONARRIVAL',
}

export enum OrganisationPartAddressType {
  POSTAL = 'POSTAL',
  PHYSICAL = 'PHYSICAL',
  DELIVERY = 'DELIVERY',
  INVOICE = 'INVOICE',
}

export enum OrganisationPartEmailPurposeType {
  INVOICE_ADDRESS = 'INVOICE_ADDRESS',
  OTHER = 'OTHER',
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

export interface OrganisationPartPurchase {
  purchaseId?: string;
  purchaserName?: string;
  purchaserEmailAddress?: string;
  purchaserPhoneNumber?: string;
  purchaseRedirectUrl?: string;
  purchaseAmount?: number;
  purchaseStatus?: string;
  paymentTransactionId?: string;
  paymentOrderUrl?: string;
  paymentOrderTime?: string;
  paymentNumber?: string;
  paymentResponseCode?: string;
  paymentReceiptNumber?: string;
  issuedOpn?: string;
}

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

export interface OrganisationPartRequest {
  termsAndConditionsAccepted: boolean;
  organisationPart: OrganisationPart;
  purchaserDetails?: OrganisationPartPurchase;
}

export interface OrganisationPartResponse extends OrganisationPart {
  // Response may include additional fields
}

export interface OrganisationPartSearchResponse {
  pageSize?: number;
  page?: number;
  totalItems?: number;
  sortBy?: string;
  sortOrder?: string;
  items: OrganisationPart[];
  links?: Array<{
    rel?: string;
    href?: string;
    methods?: string[];
  }>;
}

export interface ErrorResponse {
  status?: string;
  errorDescription?: string;
  errorCode?: string;
  list?: Array<{
    field?: string;
    message?: string;
  }>;
}
