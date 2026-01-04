import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

@Injectable()
export class NzbnOAuthService {
  private readonly logger = new Logger(NzbnOAuthService.name);
  private readonly httpClient: AxiosInstance;
  private readonly authorizeUrl: string;
  private readonly tokenUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scope: string;
  private readonly policy: string;

  constructor(private configService: ConfigService) {
    this.authorizeUrl = this.configService.get<string>(
      'nzbn.oauth.authorizeUrl',
      'https://api.business.govt.nz/oauth2/v2.0/authorize',
    );
    this.tokenUrl = this.configService.get<string>(
      'nzbn.oauth.tokenUrl',
      'https://api.business.govt.nz/oauth2/v2.0/token',
    );
    this.logger.log(`Token URL configured as: ${this.tokenUrl}`);
    this.clientId = this.configService.get<string>('nzbn.oauth.clientId', '');
    this.clientSecret = this.configService.get<string>('nzbn.oauth.clientSecret', '');
    this.redirectUri = this.configService.get<string>(
      'nzbn.oauth.redirectUri',
      'http://localhost:3001/nzbn/oauth/callback',
    );
    this.scope = this.configService.get<string>(
      'nzbn.oauth.scope',
      'https://api.business.govt.nz/sandbox/NZBNCO:manage offline_access',
    );
    this.policy = this.configService.get<string>(
      'nzbn.oauth.policy',
      'b2c_1a_api_consent_susi',
    );

    this.httpClient = axios.create({
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    });
  }

      /**
       * Generate authorization URL with required parameters
       */
      getAuthorizationUrl(state: string): string {
        const params = new URLSearchParams({
          p: this.policy,
          response_type: 'code',
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          scope: this.scope,
          state: state,
        });

        const authorizationUrl = `${this.authorizeUrl}?${params.toString()}`;
        this.logger.log(`Generated OAuth authorization URL with state: ${state}`);
        this.logger.log(`Authorization URL: ${authorizationUrl}`);
        this.logger.debug(`Authorization URL parameters:`, {
          p: this.policy,
          response_type: 'code',
          client_id: this.clientId ? `${this.clientId.substring(0, 10)}...` : 'MISSING',
          redirect_uri: this.redirectUri,
          scope: this.scope,
          state: state,
        });

        return authorizationUrl;
      }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for token');

      // Create Basic Auth header (base64(client_id:client_secret))
      const credentials = `${this.clientId}:${this.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');

      // Build query parameters (as per Postman - parameters go in query string, not body)
      const queryParams = new URLSearchParams({
        p: 'b2c_1a_api_consent_susi',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      });

      // The token URL needs to include the query parameters
      // Note: Postman shows URL as https://api.business.govt.nz//api.business.govt.nz/oauth2/v2.0/token
      // But that seems wrong - let's use the configured URL and append query params
      const requestUrl = `${this.tokenUrl}?${queryParams.toString()}`;
      
      // Log full request details
      this.logger.log('=== TOKEN EXCHANGE REQUEST ===');
      this.logger.log(`Request URL: ${requestUrl}`);
      this.logger.log(`Request Method: POST`);
      this.logger.log(`Authorization: Basic ${basicAuth ? 'PRESENT' : 'MISSING'}`);
      this.logger.log(`Request Headers: ${JSON.stringify({ ...this.httpClient.defaults.headers, Authorization: 'Basic ***' })}`);
      this.logger.log(`Query Params: ${queryParams.toString()}`);
      this.logger.log(`Request Body: (empty - parameters in query string)`);
      this.logger.log(`Client ID: ${this.clientId ? 'PRESENT' : 'MISSING'}`);
      this.logger.log(`Client Secret: ${this.clientSecret ? 'PRESENT' : 'MISSING'}`);
      this.logger.log('==============================');

      const response = await this.httpClient.post<OAuthTokenResponse>(
        requestUrl,
        '', // Empty body - parameters are in query string
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
          },
        },
      );

      // Log full response details
      this.logger.log('=== TOKEN EXCHANGE RESPONSE (SUCCESS) ===');
      this.logger.log(`Response Status: ${response.status} ${response.statusText}`);
      this.logger.log(`Response Headers: ${JSON.stringify(response.headers)}`);
      this.logger.log(`Response Data: ${JSON.stringify(response.data)}`);
      this.logger.log('==========================================');

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      // Log full error details
      this.logger.error('=== TOKEN EXCHANGE RESPONSE (ERROR) ===');
      this.logger.error(`Error Message: ${error.message}`);
      this.logger.error(`Error Code: ${error.code}`);
      this.logger.error(`Error Stack: ${error.stack}`);
      
      if (error.response) {
        this.logger.error(`Response Status: ${error.response.status} ${error.response.statusText}`);
        this.logger.error(`Response Headers: ${JSON.stringify(error.response.headers)}`);
        this.logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        this.logger.error(`Request made but no response received`);
        this.logger.error(`Request: ${JSON.stringify(error.request)}`);
      }
      
      const queryParams = new URLSearchParams({
        p: 'b2c_1a_api_consent_susi',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      });
      const requestUrl = `${this.tokenUrl}?${queryParams.toString()}`;
      this.logger.error(`Request URL: ${requestUrl}`);
      this.logger.error(`Request Method: POST`);
      const credentials = `${this.clientId}:${this.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');
      this.logger.error(`Authorization: Basic ${basicAuth ? 'PRESENT' : 'MISSING'}`);
      this.logger.error(`Query Params: ${queryParams.toString()}`);
      this.logger.error(`Request Body: (empty - parameters in query string)`);
      this.logger.error('======================================');

      const errorResponse = error.response?.data;
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          statusCode,
          message: 'Failed to exchange authorization code for token',
          error: errorResponse || error.message,
        },
        statusCode,
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      this.logger.log('Refreshing access token');

      // Create Basic Auth header (base64(client_id:client_secret))
      const credentials = `${this.clientId}:${this.clientSecret}`;
      const basicAuth = Buffer.from(credentials).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: this.scope,
      });

      const response = await this.httpClient.post<OAuthTokenResponse>(
        this.tokenUrl,
        params.toString(),
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
          },
        },
      );

      this.logger.log('Successfully refreshed token');
      return response.data;
    } catch (error) {
      this.logger.error(`Error refreshing token: ${error.message}`, error.stack);

      const errorResponse = error.response?.data;
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          statusCode,
          message: 'Failed to refresh access token',
          error: errorResponse || error.message,
        },
        statusCode,
      );
    }
  }
}
