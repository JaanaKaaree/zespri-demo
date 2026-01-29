import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  MATTRCredentialRequest,
  MATTRCredentialResponse,
  MATTRCredentialStatus,
  MATTRQRCodeResponse,
  MATTRVerifyRequest,
  MATTRVerifyResponse,
} from './interfaces/mattr-api.interface';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { MATTROAuthService } from './services/mattr-oauth.service';

@Injectable()
export class IssuanceService {
  private readonly logger = new Logger(IssuanceService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly issuerDid: string;
  private readonly issuerName: string;

  constructor(
    private configService: ConfigService,
    private mattrOAuthService: MATTROAuthService,
  ) {
    this.apiUrl = this.configService.get<string>('matt.apiUrl', '');
    this.issuerDid = this.configService.get<string>('matt.issuerDid', 'did:web:nzbn-pre.vii.au01.mattr.global');
    this.issuerName = this.configService.get<string>('matt.issuerName', 'NZBN Organization');
    
    if (!this.apiUrl) {
      this.logger.warn('⚠️ MATTR_API_URL is not configured. Credential creation will fail.');
    } else {
      this.logger.log(`📍 MATTR API URL configured: ${this.apiUrl}`);
    }
    this.logger.log(`📍 MATTR Issuer DID configured: ${this.issuerDid}`);

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add request interceptor to inject OAuth token and log requests
    this.httpClient.interceptors.request.use(
      async (config) => {
        try {
          const accessToken = await this.mattrOAuthService.getAccessToken();
          config.headers.Authorization = `Bearer ${accessToken}`;
          
          // Log full request details
          const fullUrl = `${config.baseURL}${config.url}`;
          const isBinaryRequest = config.responseType === 'arraybuffer' || 
                                  config.responseType === 'blob';
          
          this.logger.log('═══════════════════════════════════════════════════════════');
          this.logger.log('📤 MATTR API REQUEST');
          this.logger.log('═══════════════════════════════════════════════════════════');
          this.logger.log(`Method: ${config.method?.toUpperCase()}`);
          this.logger.log(`URL: ${fullUrl}`);
          this.logger.log(`Headers: ${JSON.stringify(config.headers, null, 2)}`);
          if (config.data) {
            // Skip logging binary request bodies
            if (isBinaryRequest || config.data instanceof ArrayBuffer || config.data instanceof Blob) {
              const dataSize = config.data instanceof ArrayBuffer 
                ? `${config.data.byteLength} bytes` 
                : typeof config.data === 'string' && config.data.length > 1000
                  ? `${config.data.length} chars (truncated)`
                  : typeof config.data === 'string'
                    ? `${config.data.length} chars`
                    : 'unknown';
              this.logger.log(`Body: [Binary or large data - ${dataSize}]`);
            } else {
              try {
                // Truncate very long payloads (like encoded credentials)
                const bodyStr = JSON.stringify(config.data, null, 2);
                if (bodyStr.length > 2000) {
                  this.logger.log(`Body: ${bodyStr.substring(0, 2000)}... [truncated - ${bodyStr.length} chars total]`);
                } else {
                  this.logger.log(`Body: ${bodyStr}`);
                }
              } catch (error) {
                this.logger.log(`Body: [Unable to stringify request body]`);
              }
            }
          }
          if (config.params) {
            this.logger.log(`Query Params: ${JSON.stringify(config.params, null, 2)}`);
          }
          this.logger.log('═══════════════════════════════════════════════════════════');
        } catch (error) {
          this.logger.error(`❌ Failed to get MATTR access token: ${error.message}`);
          throw error;
        }
        return config;
      },
      (error) => {
        this.logger.error(`❌ MATTR API Request Error: ${error.message}`);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for detailed logging
    this.httpClient.interceptors.response.use(
      (response) => {
        // Log full response details
        const fullUrl = `${response.config.baseURL}${response.config.url}`;
        const isBinaryResponse = response.config.responseType === 'arraybuffer' || 
                                 response.config.responseType === 'blob' ||
                                 response.headers['content-type']?.includes('image/');
        
        this.logger.log('═══════════════════════════════════════════════════════════');
        this.logger.log('📥 MATTR API RESPONSE (SUCCESS)');
        this.logger.log('═══════════════════════════════════════════════════════════');
        this.logger.log(`URL: ${fullUrl}`);
        this.logger.log(`Status: ${response.status} ${response.statusText}`);
        this.logger.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
        
        // Skip logging binary data (QR codes, images, etc.)
        if (isBinaryResponse) {
          const dataSize = response.data instanceof ArrayBuffer 
            ? `${response.data.byteLength} bytes` 
            : typeof response.data === 'string' 
              ? `${response.data.length} chars` 
              : 'unknown';
          this.logger.log(`Data: [Binary response - ${dataSize}]`);
        } else {
          try {
            this.logger.log(`Data: ${JSON.stringify(response.data, null, 2)}`);
          } catch (error) {
            this.logger.log(`Data: [Unable to stringify response data]`);
          }
        }
        this.logger.log('═══════════════════════════════════════════════════════════');
        return response;
      },
      (error) => {
        // Log full error details
        const fullUrl = error.config
          ? `${error.config.baseURL}${error.config.url}`
          : 'Unknown URL';
        this.logger.error('═══════════════════════════════════════════════════════════');
        this.logger.error('❌ MATTR API RESPONSE (ERROR)');
        this.logger.error('═══════════════════════════════════════════════════════════');
        this.logger.error(`URL: ${fullUrl}`);
        this.logger.error(`Status: ${error.response?.status || 'No Response'}`);
        this.logger.error(`Status Text: ${error.response?.statusText || 'N/A'}`);
        if (error.response?.headers) {
          this.logger.error(`Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
        }
        if (error.response?.data) {
          this.logger.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        this.logger.error(`Error Message: ${error.message}`);
        if (error.config?.data) {
          this.logger.error(`Request Body: ${JSON.stringify(error.config.data, null, 2)}`);
        }
        this.logger.error('═══════════════════════════════════════════════════════════');
        return Promise.reject(error);
      },
    );
  }

  async createCredential(
    createCredentialDto: CreateCredentialDto,
  ): Promise<MATTRCredentialResponse> {
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔵 MATTR API CALL: createCredential');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Template ID: ${createCredentialDto.templateId}`);
    this.logger.log(`Credential Data Keys: ${Object.keys(createCredentialDto.credentialData || {}).join(', ')}`);
    
    // Prepare MATTR API request payload according to MATTR CWT API
    // The API expects { payload: { iss: "did:web:...", ...claims } }
    // See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-issuance/sign-compact-credential
    
    // Build payload with iss (issuer DID) and all claims
    const payloadContent: any = {
      iss: this.issuerDid, // Required: issuer DID (must be did:web)
      ...createCredentialDto.credentialData, // All claims go into payload
    };

    // Add subject (sub) if provided (DID or email)
    if (createCredentialDto.recipientDid) {
      payloadContent.sub = createCredentialDto.recipientDid;
      this.logger.log(`Recipient DID: ${createCredentialDto.recipientDid}`);
    } else if (createCredentialDto.recipientEmail) {
      payloadContent.sub = createCredentialDto.recipientEmail;
      this.logger.log(`Recipient Email: ${createCredentialDto.recipientEmail}`);
    }

    const requestPayload = {
      payload: payloadContent,
      revocable: true,
      isRevoked: false,
    };

    // Validate API URL is configured
    if (!this.apiUrl) {
      this.logger.error('❌ MATTR_API_URL is not configured');
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'MATTR_API_URL is not configured',
          error: 'MATTR_API_URL_MISSING',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const fullUrl = `${this.apiUrl}/v2/credentials/compact/sign`;

    try {
      this.logger.log(`Creating CWT credential with template: ${createCredentialDto.templateId}`);
      this.logger.log('📤 MATTR CWT Credential Sign Request:');
      this.logger.log(`   Full URL: ${fullUrl}`);
      this.logger.log(`   Base URL: ${this.apiUrl}`);
      this.logger.log(`   Endpoint: /v2/credentials/compact/sign`);
      this.logger.log(`   Method: POST`);
      this.logger.log(`   Payload: ${JSON.stringify(requestPayload, null, 2)}`);

      // Make actual API call to MATTR CWT endpoint
      this.logger.log('🚀 Making HTTP request to MATTR CWT API...');
      const response = await this.httpClient.post<MATTRCredentialResponse>(
        '/v2/credentials/compact/sign',
        requestPayload,
      );
      this.logger.log('✅ HTTP request completed');

      this.logger.log('📥 MATTR CWT Credential Response:');
      this.logger.log(`   Status: ${response.status}`);
      this.logger.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);

      // Extract the encoded credential from response
      // Response may contain credential directly or in various fields
      const responseData = response.data;
      let encodedCredential: string | undefined;
      
      // Try different possible response formats
      if (typeof responseData === 'string') {
        encodedCredential = responseData;
      } else if (responseData.credential) {
        encodedCredential = responseData.credential;
      } else if (responseData.encoded) {
        encodedCredential = responseData.encoded;
      } else if (responseData.id && typeof responseData.id === 'string' && responseData.id.startsWith('CSC:')) {
        encodedCredential = responseData.id;
      }

      const credentialResponse: MATTRCredentialResponse = {
        id: responseData.id || `cred-${Date.now()}`,
        status: 'issued', // CWT credentials are issued immediately upon signing
        credentialId: responseData.id,
        issuanceUrl: responseData.issuanceUrl, // May not be present for CWT
        encoded: encodedCredential, // CWT credential in compact format (CSC:...)
        credential: encodedCredential, // Alias for backward compatibility
        error: responseData.error,
      };

      this.logger.log(`✅ Credential created successfully: ${credentialResponse.id}`);
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ MATTR API CALL COMPLETED: createCredential');
      this.logger.log('═══════════════════════════════════════════════════════════');
      return credentialResponse;
      } catch (error) {
        this.logger.error(`❌ Error creating credential: ${error.message}`);
        
        // Check for DNS/network errors
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          this.logger.error('');
          this.logger.error('💡 Network/DNS Error Detected:');
          this.logger.error(`   Error Code: ${error.code}`);
          this.logger.error(`   API URL: ${this.apiUrl}`);
          this.logger.error('   Possible issues:');
          this.logger.error('   1. MATTR_API_URL is incorrect or domain does not exist');
          this.logger.error('   2. Network connectivity issue');
          this.logger.error('   3. DNS resolution failure');
          this.logger.error('   4. Firewall blocking the connection');
          this.logger.error('');
          this.logger.error('   💡 Tip: Based on your audience (nzbn-pre.vii.au01.mattr.global),');
          this.logger.error('      your API URL might need to match that pattern, e.g.:');
          this.logger.error('      MATTR_API_URL=https://nzbn-pre.vii.au01.mattr.global');
        }
        
        if (error.response) {
          this.logger.error(`   Status: ${error.response.status}`);
          this.logger.error(`   Status Text: ${error.response.statusText}`);
          this.logger.error(`   Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
          this.logger.error(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
          
          // Provide specific troubleshooting for 403 errors
          if (error.response.status === 403) {
            this.logger.error('');
            this.logger.error('💡 Troubleshooting 403 Forbidden:');
            this.logger.error('   A 403 error typically means authentication succeeded but authorization failed.');
            this.logger.error('');
            this.logger.error('   Common causes and solutions:');
            this.logger.error('   1. ❓ Request Payload Structure:');
            this.logger.error('      • CWT endpoint requires payload wrapped in "payload" object');
            this.logger.error('      • Payload must include "iss" field with did:web format');
            this.logger.error('      • See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-issuance/sign-compact-credential');
            this.logger.error('');
            this.logger.error('   2. ❓ OAuth Token Scopes:');
            this.logger.error('      • Check if the token has required scopes (e.g., credentials:write, credentials:issue)');
            this.logger.error('      • Verify scopes in OAuth token request match MATTR tenant requirements');
            this.logger.error('      • Check MATTR OAuth application settings for granted scopes');
            this.logger.error('');
            this.logger.error('   3. ❓ API Endpoint:');
            this.logger.error(`      • Current endpoint: ${fullUrl}`);
            this.logger.error('      • Verify this matches your MATTR tenant\'s API documentation');
            this.logger.error('      • Some tenants may use different endpoints or API versions');
            this.logger.error('');
            this.logger.error('   4. ❓ Tenant Configuration:');
            this.logger.error('      • Check MATTR tenant API access restrictions');
            this.logger.error('      • Verify OAuth application is properly configured for credential issuance');
            this.logger.error('      • Confirm the credential configuration is published/active');
            this.logger.error('');
            this.logger.error('   📋 Request Details:');
            this.logger.error(`      URL: ${fullUrl}`);
            this.logger.error(`      Method: POST`);
            this.logger.error(`      Has Authorization Header: ${error.config?.headers?.Authorization ? 'Yes' : 'No'}`);
            this.logger.error(`      Issuer DID: ${this.issuerDid}`);
            this.logger.error('');
            this.logger.error('   📚 Next Steps:');
            this.logger.error('      • Check MATTR Platform documentation for your tenant\'s specific API requirements');
            this.logger.error('      • Verify OAuth client scopes in MATTR tenant dashboard');
            this.logger.error('      • Test the credential configuration ID using MATTR Platform UI or Postman');
          }
        } else if (error.request) {
          this.logger.error(`   Request made but no response received`);
          this.logger.error(`   Request URL: ${error.config?.url || 'Unknown'}`);
        }
        this.logger.error(error.stack);

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to create credential with MATTR platform',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get credential status for a compact credential
   * Uses the MATTR /v2/credentials/compact/{id}/revocation-status endpoint (GET)
   * For compact credentials, they are issued immediately when signed, so we check revocation status
   * See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-issuance/get-revocation-status-compact-credential
   * @param credentialId The MATTR credential ID
   */
  async getCredentialStatus(credentialId: string): Promise<MATTRCredentialStatus> {
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔵 MATTR API CALL: getCredentialStatus');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Credential ID: ${credentialId}`);
    
    try {
      this.logger.log(`Getting credential revocation status: ${credentialId}`);

      const fullUrl = `${this.apiUrl}/v2/credentials/compact/${credentialId}/revocation-status`;
      this.logger.log('📤 MATTR Credential Status Request:');
      this.logger.log(`   Full URL: ${fullUrl}`);
      this.logger.log(`   Method: GET`);

      // Make actual API call to MATTR v2 endpoint
      this.logger.log('🚀 Making HTTP request to MATTR API...');
      const response = await this.httpClient.get<{ isRevoked: boolean }>(
        `/v2/credentials/compact/${credentialId}/revocation-status`,
      );
      this.logger.log('✅ HTTP request completed');

      this.logger.log('📥 MATTR Credential Status Response:');
      this.logger.log(`   Status: ${response.status}`);
      this.logger.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);

      // Compact credentials are issued immediately when signed
      // Status is based on revocation status
      const isRevoked = response.data?.isRevoked || false;
      const statusResponse: MATTRCredentialStatus = {
        id: credentialId,
        status: isRevoked ? 'revoked' : 'issued',
        credentialId: credentialId,
        error: undefined,
      };

      this.logger.log(`✅ Credential status retrieved: ${statusResponse.status} (revoked: ${isRevoked})`);
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ MATTR API CALL COMPLETED: getCredentialStatus');
      this.logger.log('═══════════════════════════════════════════════════════════');
      return statusResponse;
    } catch (error) {
      this.logger.error(`❌ Error getting credential status: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      this.logger.error(error.stack);

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to get credential status from MATTR platform',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Generate QR code for a CWT credential
   * Uses the MATTR /v2/credentials/compact/qrcode endpoint
   * See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-issuance/generateQrCodeCompactCredential
   * @param encodedCredential The encoded CWT credential in compact format (CSC:...)
   */
  async generateCredentialQRCode(encodedCredential: string): Promise<MATTRQRCodeResponse> {
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔵 MATTR API CALL: generateCredentialQRCode');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Credential length: ${encodedCredential?.length || 0} chars`);
    this.logger.log(`Credential preview: ${encodedCredential?.substring(0, 50)}...`);
    
    try {
      this.logger.log(`Generating QR code for CWT credential`);

      const fullUrl = `${this.apiUrl}/v2/credentials/compact/qrcode`;
      this.logger.log('📤 MATTR QR Code Generation Request:');
      this.logger.log(`   Full URL: ${fullUrl}`);
      this.logger.log(`   Method: POST`);
      this.logger.log(`   Credential length: ${encodedCredential?.length || 0} chars`);

      // MATTR QR code endpoint expects payload with the encoded credential string
      // See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-issuance/generateQrCodeCompactCredential
      const requestPayload = {
        payload: encodedCredential, // API expects "payload" field, not "credential"
      };

      // Make actual API call to MATTR
      // Response is image/png (binary), not JSON
      this.logger.log('🚀 Making HTTP request to MATTR QR Code API...');
      const response = await this.httpClient.post<ArrayBuffer>(
        '/v2/credentials/compact/qrcode',
        requestPayload,
        {
          responseType: 'arraybuffer', // Handle binary response
        },
      );
      this.logger.log('✅ HTTP request completed');

      // Convert binary response to base64
      const qrCodeBuffer = Buffer.from(response.data);
      const qrCodeBase64 = qrCodeBuffer.toString('base64');

      this.logger.log('📥 MATTR QR Code Response:');
      this.logger.log(`   Status: ${response.status}`);
      this.logger.log(`   Content-Type: ${response.headers['content-type'] || 'image/png'}`);
      this.logger.log(`   QR Code size: ${qrCodeBase64.length} bytes (base64)`);

      const qrCodeResponse: MATTRQRCodeResponse = {
        qrcode: qrCodeBase64, // Store base64 string
        type: (response.headers['content-type'] as string) || 'image/png',
      };

      this.logger.log(`✅ QR code generated successfully`);
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ MATTR API CALL COMPLETED: generateCredentialQRCode');
      this.logger.log('═══════════════════════════════════════════════════════════');
      return qrCodeResponse;
    } catch (error) {
      this.logger.error(`❌ Error generating QR code: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      this.logger.error(error.stack);

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to generate QR code with MATTR platform',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Verify a CWT credential using MATTR verification endpoint
   * Uses the MATTR /v2/credentials/compact/verify endpoint
   * See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-verification/verify-compact-credential
   * @param payload The encoded CWT credential in compact format (CSC:...)
   */
  async verifyCredential(payload: string): Promise<MATTRVerifyResponse> {
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔵 MATTR API CALL: verifyCredential');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Payload length: ${payload?.length || 0} chars`);
    this.logger.log(`Payload preview: ${payload?.substring(0, 100)}...`);
    
    try {
      this.logger.log(`Verifying CWT credential`);

      const fullUrl = `${this.apiUrl}/v2/credentials/compact/verify`;
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('📤 MATTR CREDENTIAL VERIFICATION REQUEST');
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log(`Full URL: ${fullUrl}`);
      this.logger.log(`Method: POST`);
      this.logger.log(`Payload length: ${payload?.length || 0} chars`);
      this.logger.log(`Payload (first 100 chars): ${payload?.substring(0, 100)}...`);

      // Prepare verification request
      const verifyRequest: MATTRVerifyRequest = {
        payload,
        trustedIssuers: [this.issuerDid],
        assertValidFrom: true,
        assertValidUntil: true,
        checkRevocation: true,
      };

      this.logger.log(`Trusted Issuer: ${this.issuerDid}`);
      this.logger.log(`Request Body: ${JSON.stringify(verifyRequest, null, 2)}`);
      this.logger.log('═══════════════════════════════════════════════════════════');

      // Make actual API call to MATTR
      this.logger.log('🚀 Making HTTP request to MATTR Verification API...');
      const response = await this.httpClient.post<MATTRVerifyResponse>(
        '/v2/credentials/compact/verify',
        verifyRequest,
      );
      this.logger.log('✅ HTTP request completed');

      this.logger.log('📥 MATTR Verification Response:');
      this.logger.log(`   Status: ${response.status}`);
      this.logger.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);

      // Return the full MATTR response including decoded credential data
      const verifyResponse: MATTRVerifyResponse = {
        verified: response.data.verified || false,
        decoded: response.data.decoded, // Contains the credential claims/data
        payload: response.data.payload, // For compatibility
        errors: response.data.errors,
        warnings: response.data.warnings,
      };

      this.logger.log(`✅ Credential verification ${verifyResponse.verified ? 'succeeded' : 'failed'}`);
      if (verifyResponse.decoded) {
        this.logger.log(`📋 Decoded credential data keys: ${Object.keys(verifyResponse.decoded).join(', ')}`);
      }
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ MATTR API CALL COMPLETED: verifyCredential');
      this.logger.log('═══════════════════════════════════════════════════════════');
      return verifyResponse;
    } catch (error) {
      this.logger.error(`❌ Error verifying credential: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      this.logger.error(error.stack);

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to verify credential with MATTR platform',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Revoke a compact credential using MATTR API
   * Uses the MATTR /v2/credentials/compact/{id}/revocation-status endpoint
   * See: https://learn.mattr.global/docs/api-reference/platform/cwt-credentials-issuance/revoke-compact-credential
   * @param credentialId The MATTR credential ID to revoke
   */
  async revokeCredential(credentialId: string): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔵 MATTR API CALL: revokeCredential');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Credential ID: ${credentialId}`);
    
    try {
      this.logger.log(`Revoking compact credential: ${credentialId}`);

      const fullUrl = `${this.apiUrl}/v2/credentials/compact/${credentialId}/revocation-status`;
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('📤 MATTR CREDENTIAL REVOCATION REQUEST');
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log(`Full URL: ${fullUrl}`);
      this.logger.log(`Method: POST`);
      this.logger.log(`Credential ID: ${credentialId}`);

      // MATTR revocation endpoint expects a POST request with revocation status
      // The request body typically contains revocation status information
      const requestPayload = {
        isRevoked: true,
      };

      this.logger.log(`Request Body: ${JSON.stringify(requestPayload, null, 2)}`);
      this.logger.log('═══════════════════════════════════════════════════════════');

      // Make actual API call to MATTR
      this.logger.log('🚀 Making HTTP request to MATTR Revocation API...');
      const response = await this.httpClient.post(
        `/v2/credentials/compact/${credentialId}/revocation-status`,
        requestPayload,
      );
      this.logger.log('✅ HTTP request completed');

      this.logger.log('📥 MATTR Revocation Response:');
      this.logger.log(`   Status: ${response.status}`);
      this.logger.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);

      this.logger.log(`✅ Credential revoked successfully: ${credentialId}`);
      this.logger.log('═══════════════════════════════════════════════════════════');
      this.logger.log('✅ MATTR API CALL COMPLETED: revokeCredential');
      this.logger.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      this.logger.error(`❌ Error revoking credential: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      this.logger.error(error.stack);

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to revoke credential with MATTR platform',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
