import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface MATTROAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

@Injectable()
export class MATTROAuthService {
  private readonly logger = new Logger(MATTROAuthService.name);
  private readonly httpClient: AxiosInstance;
  private readonly oauthUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly audience: string;
  private cachedToken: {
    access_token: string;
    expires_at: number;
  } | null = null;

  constructor(private configService: ConfigService) {
    this.oauthUrl =
      this.configService.get<string>('matt.oauthUrl') ||
      this.configService.get<string>('matt.tokenUrl') ||
      this.configService.get<string>('matt.apiUrl', '') + '/oauth/token';
    this.clientId = this.configService.get<string>('matt.clientId', '');
    this.clientSecret = this.configService.get<string>('matt.clientSecret', '');
    this.audience = this.configService.get<string>('matt.audience', '');

    this.httpClient = axios.create({
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    });
  }

  /**
   * Get OAuth access token using client credentials flow
   * Implements token caching to avoid unnecessary token requests
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.cachedToken && this.cachedToken.expires_at > Date.now() + 60000) {
      // Token is still valid (with 1 minute buffer)
      this.logger.debug('Using cached MATTR access token');
      return this.cachedToken.access_token;
    }

    try {
      this.logger.log('🔑 Requesting new MATTR access token using client credentials');

      // Validate configuration before making request
      if (!this.clientId || !this.clientSecret) {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'MATTR_CLIENT_ID and MATTR_CLIENT_SECRET environment variables are required',
            error: 'MATTR_CLIENT_CREDENTIALS_MISSING',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Prepare request body
      const requestBody = {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        ...(this.audience && { audience: this.audience }),
      };

      this.logger.log('📤 MATTR OAuth Request:');
      this.logger.log(`   URL: ${this.oauthUrl}`);
      this.logger.log(`   Method: POST`);
      this.logger.log(`   Headers: Content-Type: application/x-www-form-urlencoded`);
      this.logger.log(
        `   Body: ${JSON.stringify({ ...requestBody, client_secret: '***' }, null, 2)}`,
      );

      // OAuth token requests should use form-encoded data, not JSON
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      if (this.audience) {
        formData.append('audience', this.audience);
      }

      let response;
      let formEncodedError: any = null;
      
      try {
        this.logger.log('🔄 Attempting form-encoded authentication...');
        response = await this.httpClient.post<MATTROAuthTokenResponse>(
          this.oauthUrl,
          formData,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );
        this.logger.log('✅ Form-encoded authentication succeeded');
      } catch (error) {
        formEncodedError = error;
        // Log the initial error
        this.logger.error('❌ Form-encoded authentication failed');
        if (error.response) {
          this.logger.error(`   Status: ${error.response.status}`);
          this.logger.error(`   Status Text: ${error.response.statusText}`);
          this.logger.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
          this.logger.error(`   Error: ${error.message}`);
        }
        
        // If form-encoded fails with 401, try Basic Auth as alternative
        if (error.response?.status === 401) {
          this.logger.log('⚠️ Form-encoded auth failed with 401, trying Basic Authentication...');
          
          // Create Basic Auth header (base64(client_id:client_secret))
          const credentials = `${this.clientId}:${this.clientSecret}`;
          const basicAuth = Buffer.from(credentials).toString('base64');
          
          const basicAuthFormData = new URLSearchParams();
          basicAuthFormData.append('grant_type', 'client_credentials');
          if (this.audience) {
            basicAuthFormData.append('audience', this.audience);
          }
          
          this.logger.log('📤 MATTR OAuth Request (Basic Auth Retry):');
          this.logger.log(`   URL: ${this.oauthUrl}`);
          this.logger.log(`   Method: POST`);
          this.logger.log(`   Headers: Authorization: Basic ***, Content-Type: application/x-www-form-urlencoded`);
          this.logger.log(`   Body: ${basicAuthFormData.toString()}`);
          
          try {
            response = await this.httpClient.post<MATTROAuthTokenResponse>(
              this.oauthUrl,
              basicAuthFormData,
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization: `Basic ${basicAuth}`,
                },
              },
            );
            this.logger.log('✅ Basic Authentication succeeded');
          } catch (basicAuthError) {
            // If Basic Auth also fails, log both errors
            this.logger.error('❌ Basic Authentication also failed');
            if (basicAuthError.response) {
              this.logger.error(`   Status: ${basicAuthError.response.status}`);
              this.logger.error(`   Data: ${JSON.stringify(basicAuthError.response.data, null, 2)}`);
            }
            // Throw the original error with more context
            throw error;
          }
        } else {
          throw error;
        }
      }

      this.logger.log('📥 MATTR OAuth Response:');
      this.logger.log(`   Status: ${response.status}`);
      this.logger.log(`   Status Text: ${response.statusText}`);

      const tokenData = response.data;

      if (!tokenData.access_token) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_GATEWAY,
            message: 'No access token received from MATTR',
            error: 'INVALID_TOKEN_RESPONSE',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Cache the token with expiration
      const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour
      this.cachedToken = {
        access_token: tokenData.access_token,
        expires_at: Date.now() + expiresIn * 1000,
      };

      // Try to decode and log token scopes if it's a JWT
      if (tokenData.scope) {
        this.logger.log(`   Token Scopes: ${tokenData.scope}`);
      }
      
      // If token is a JWT, try to decode and log claims (excluding signature)
      try {
        const tokenParts = tokenData.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          this.logger.log(`   Token Type: JWT`);
          this.logger.log(`   Token Audience: ${payload.aud || 'N/A'}`);
          this.logger.log(`   Token Issuer: ${payload.iss || 'N/A'}`);
          this.logger.log(`   Token Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'}`);
          if (payload.scope) {
            this.logger.log(`   Token Scopes (from JWT): ${payload.scope}`);
          }
          if (payload.scp) {
            this.logger.log(`   Token Scopes (from scp claim): ${Array.isArray(payload.scp) ? payload.scp.join(', ') : payload.scp}`);
          }
        }
      } catch (e) {
        // Token is not a JWT or couldn't decode - that's okay
        this.logger.debug('   Token is not a decodable JWT or decoding failed');
      }

      this.logger.log('✅ MATTR access token obtained successfully');
      return tokenData.access_token;
    } catch (error) {
      this.logger.error('═══════════════════════════════════════════════════════════');
      this.logger.error('❌ Failed to get MATTR access token');
      this.logger.error('═══════════════════════════════════════════════════════════');
      this.logger.error(`Error Message: ${error.message}`);
      this.logger.error(`Error Code: ${error.code || 'N/A'}`);
      
      if (error.response) {
        this.logger.error(`Response Status: ${error.response.status}`);
        this.logger.error(`Response Status Text: ${error.response.statusText}`);
        this.logger.error(`Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
        this.logger.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Provide helpful error messages based on status code
        if (error.response.status === 401) {
          this.logger.error('');
          this.logger.error('💡 Troubleshooting 401 Unauthorized:');
          this.logger.error('   1. Verify MATTR_CLIENT_ID is correct');
          this.logger.error('   2. Verify MATTR_CLIENT_SECRET is correct');
          this.logger.error('   3. Check if MATTR_AUDIENCE is required and correct');
          this.logger.error('   4. Verify MATTR_OAUTH_URL is correct');
          this.logger.error('   5. Check if client credentials have proper permissions');
        }
      } else if (error.request) {
        this.logger.error('No response received from server');
        this.logger.error(`Request URL: ${this.oauthUrl}`);
        this.logger.error(`Request Config: ${JSON.stringify(error.config, null, 2)}`);
      }
      
      this.logger.error(`Stack Trace: ${error.stack}`);
      this.logger.error('═══════════════════════════════════════════════════════════');

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to obtain MATTR access token',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Clear cached token (useful for testing or forced refresh)
   */
  clearTokenCache(): void {
    this.cachedToken = null;
    this.logger.debug('Cleared MATTR token cache');
  }
}
