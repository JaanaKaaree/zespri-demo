import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  MATTRCredentialRequest,
  MATTRCredentialResponse,
  MATTRCredentialStatus,
} from './interfaces/mattr-api.interface';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class IssuanceService {
  private readonly logger = new Logger(IssuanceService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('matt.apiUrl', '');
    this.apiKey = this.configService.get<string>('matt.apiKey', '');

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`MATTR API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`MATTR API Request Error: ${error.message}`);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`MATTR API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(
          `MATTR API Response Error: ${error.response?.status} ${error.response?.data?.message || error.message}`,
        );
        return Promise.reject(error);
      },
    );
  }

  async createCredential(
    createCredentialDto: CreateCredentialDto,
  ): Promise<MATTRCredentialResponse> {
    try {
      this.logger.log(`Creating credential with template: ${createCredentialDto.templateId}`);

      // This is a placeholder implementation
      // Replace with actual MATTR API endpoint and payload structure
      const requestPayload: MATTRCredentialRequest = {
        templateId: createCredentialDto.templateId,
        credentialData: createCredentialDto.credentialData,
        recipientDid: createCredentialDto.recipientDid,
        recipientEmail: createCredentialDto.recipientEmail,
      };

      // Example MATTR API call (adjust endpoint and payload structure based on actual API)
      // const response = await this.httpClient.post('/v1/credentials', requestPayload);

      // For demo purposes, returning a mock response
      // In production, uncomment the actual API call above
      const mockResponse: MATTRCredentialResponse = {
        id: `cred-${Date.now()}`,
        status: 'pending',
        credentialId: `cred-id-${Date.now()}`,
        issuanceUrl: `${this.apiUrl}/credentials/${Date.now()}`,
      };

      this.logger.log(`Credential created successfully: ${mockResponse.id}`);
      return mockResponse;
    } catch (error) {
      this.logger.error(`Error creating credential: ${error.message}`, error.stack);
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

  async issueCredential(credentialId: string): Promise<MATTRCredentialResponse> {
    try {
      this.logger.log(`Issuing credential: ${credentialId}`);

      // Example MATTR API call (adjust endpoint based on actual API)
      // const response = await this.httpClient.post(`/v1/credentials/${credentialId}/issue`);

      // For demo purposes, returning a mock response
      const mockResponse: MATTRCredentialResponse = {
        id: credentialId,
        status: 'issued',
        credentialId,
      };

      this.logger.log(`Credential issued successfully: ${credentialId}`);
      return mockResponse;
    } catch (error) {
      this.logger.error(`Error issuing credential: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to issue credential with MATTR platform',
          error: error.response?.data || error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getCredentialStatus(credentialId: string): Promise<MATTRCredentialStatus> {
    try {
      this.logger.log(`Getting credential status: ${credentialId}`);

      // Example MATTR API call (adjust endpoint based on actual API)
      // const response = await this.httpClient.get(`/v1/credentials/${credentialId}`);

      // For demo purposes, returning a mock response
      const mockResponse: MATTRCredentialStatus = {
        id: credentialId,
        status: 'issued',
        credentialId,
      };

      return mockResponse;
    } catch (error) {
      this.logger.error(`Error getting credential status: ${error.message}`, error.stack);
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
}
