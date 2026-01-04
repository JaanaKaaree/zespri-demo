import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreateOrganisationPartDto } from './dto/create-organisation-part.dto';
import { UpdateOrganisationPartDto } from './dto/update-organisation-part.dto';
import {
  OrganisationPart,
  OrganisationPartResponse,
  OrganisationPartSearchResponse,
  ErrorResponse,
} from './interfaces/nzbn-api.interface';
import { SessionService } from '../../session/session.service';

@Injectable()
export class OrganisationsService {
  private readonly logger = new Logger(OrganisationsService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly subscriptionKey: string;

  constructor(
    private configService: ConfigService,
    private sessionService: SessionService,
  ) {
    this.apiUrl = this.configService.get<string>('nzbn.apiUrl', 'https://api.business.govt.nz/sandbox');
    this.subscriptionKey = this.configService.get<string>('nzbn.subscriptionKey', '');

    // Create axios instance without Authorization header (will be added per request)
    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`NZBN API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`NZBN API Request Error: ${error.message}`);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`NZBN API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(
          `NZBN API Response Error: ${error.response?.status} ${error.response?.data?.errorDescription || error.message}`,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get OAuth token from session
   * Checks if session exists, then checks for OAuth token and expiry
   */
  async getOAuthTokenFromSession(sessionId: string): Promise<string> {
    this.logger.log(`Getting OAuth token from session: ${sessionId}`);
    
    const session = await this.sessionService.get(sessionId);
    if (!session) {
      this.logger.warn(`Session not found for sessionId: ${sessionId}`);
      // If session doesn't exist, treat it as missing OAuth token
      // The frontend will trigger OAuth flow
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'NZBN OAuth token not found. Please connect your NZBN account.',
          error: 'OAUTH_TOKEN_MISSING',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.log(`Session found for sessionId: ${sessionId}`);
    this.logger.debug(`Session data keys: ${session.data ? Object.keys(session.data).join(', ') : 'no data'}`);

    const token = session.data?.nzbnOAuthToken?.access_token;
    if (!token) {
      this.logger.warn(`OAuth token not found in session for sessionId: ${sessionId}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'NZBN OAuth token not found. Please connect your NZBN account.',
          error: 'OAUTH_TOKEN_MISSING',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check if token is expired
    const expiresAt = session.data?.nzbnOAuthToken?.expires_at;
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      this.logger.log(`OAuth token expires at: ${expiryDate.toISOString()}, current time: ${now.toISOString()}`);
      if (expiryDate < now) {
        this.logger.warn(`OAuth token expired for sessionId: ${sessionId}`);
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'NZBN OAuth token has expired. Please reconnect your NZBN account.',
            error: 'OAUTH_TOKEN_EXPIRED',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    this.logger.log(`OAuth token found and valid for sessionId: ${sessionId}`);
    return token;
  }

  async getOrganisationParts(
    nzbn: string,
    sessionId: string,
  ): Promise<OrganisationPart[]> {
    try {
      this.logger.log(`Getting organisation parts for NZBN: ${nzbn}`);

      const token = await this.getOAuthTokenFromSession(sessionId);

      const response = await this.httpClient.get<OrganisationPartSearchResponse>(
        `/nzbn/v5/entities/${nzbn}/organisation-parts`,
        {
          headers: {
            Authorization: token, // Token only, no "Bearer" prefix
          },
        },
      );

      this.logger.log(
        `Found ${response.data.items?.length || 0} organisation parts for NZBN: ${nzbn}`,
      );
      return response.data.items || [];
    } catch (error) {
      this.logger.error(
        `Error getting organisation parts: ${error.message}`,
        error.stack,
      );

      // Re-throw HttpException as-is
      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error.response?.data as ErrorResponse;
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          statusCode,
          message: 'Failed to get organisation parts from NZBN API',
          error: errorResponse || error.message,
        },
        statusCode,
      );
    }
  }

  async createOrganisationPart(
    nzbn: string,
    sessionId: string,
    data: CreateOrganisationPartDto,
  ): Promise<OrganisationPartResponse> {
    try {
      const token = await this.getOAuthTokenFromSession(sessionId);
      this.logger.log(`Creating organisation part for NZBN: ${nzbn}`);

      const response = await this.httpClient.post<OrganisationPartResponse>(
        `/nzbn/v5/entities/${nzbn}/organisation-parts`,
        data,
        {
          headers: {
            Authorization: token, // Token only, no "Bearer" prefix
          },
        },
      );

      this.logger.log(`Organisation part created successfully for NZBN: ${nzbn}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error creating organisation part: ${error.message}`,
        error.stack,
      );

      // Re-throw HttpException as-is
      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error.response?.data as ErrorResponse;
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          statusCode,
          message: 'Failed to create organisation part with NZBN API',
          error: errorResponse || error.message,
        },
        statusCode,
      );
    }
  }

  async updateOrganisationPart(
    nzbn: string,
    opn: string,
    sessionId: string,
    data: UpdateOrganisationPartDto,
  ): Promise<OrganisationPartResponse> {
    try {
      const token = await this.getOAuthTokenFromSession(sessionId);
      this.logger.log(`Updating organisation part ${opn} for NZBN: ${nzbn}`);

      const response = await this.httpClient.put<OrganisationPartResponse>(
        `/nzbn/v5/entities/${nzbn}/organisation-parts/${opn}`,
        data,
        {
          headers: {
            Authorization: token, // Token only, no "Bearer" prefix
          },
        },
      );

      this.logger.log(`Organisation part ${opn} updated successfully for NZBN: ${nzbn}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error updating organisation part: ${error.message}`,
        error.stack,
      );

      // Re-throw HttpException as-is
      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error.response?.data as ErrorResponse;
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          statusCode,
          message: 'Failed to update organisation part with NZBN API',
          error: errorResponse || error.message,
        },
        statusCode,
      );
    }
  }

  async deleteOrganisationPart(
    nzbn: string,
    opn: string,
    sessionId: string,
  ): Promise<void> {
    try {
      const token = await this.getOAuthTokenFromSession(sessionId);
      this.logger.log(`Deleting organisation part ${opn} for NZBN: ${nzbn}`);

      await this.httpClient.delete(`/nzbn/v5/entities/${nzbn}/organisation-parts/${opn}`, {
        headers: {
          Authorization: token, // Token only, no "Bearer" prefix
        },
      });

      this.logger.log(`Organisation part ${opn} deleted successfully for NZBN: ${nzbn}`);
    } catch (error) {
      this.logger.error(
        `Error deleting organisation part: ${error.message}`,
        error.stack,
      );

      // Re-throw HttpException as-is
      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error.response?.data as ErrorResponse;
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          statusCode,
          message: 'Failed to delete organisation part with NZBN API',
          error: errorResponse || error.message,
        },
        statusCode,
      );
    }
  }
}
