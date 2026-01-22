import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IssuanceService } from '../../issuance.service';
import { CollectionIdGeneratorService } from './collection-id-generator.service';
import { OrganisationsService } from '../../../nzbn/organisations/organisations.service';
import { CreateCollectionCredentialDto } from '../dto/create-collection-credential.dto';
import { UpdateCollectionCredentialDto } from '../dto/update-collection-credential.dto';
import { CollectionCredentialResponseDto } from '../dto/collection-credential-response.dto';
import {
  CollectionCredential,
  CollectionCredentialFilters,
} from '../interfaces/collection-credential.interface';
import { CreateCredentialDto } from '../../dto/create-credential.dto';

/**
 * In-memory storage for demo purposes
 * In production, this should be replaced with a database
 */
const credentialsStorage = new Map<string, CollectionCredential>();

@Injectable()
export class CollectionCredentialService {
  private readonly logger = new Logger(CollectionCredentialService.name);
  private readonly MATTR_TEMPLATE_ID: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly issuanceService: IssuanceService,
    private readonly collectionIdGenerator: CollectionIdGeneratorService,
    private readonly organisationsService: OrganisationsService,
  ) {
    this.MATTR_TEMPLATE_ID = this.configService.get<string>(
      'matt.collectionCredentialTemplateId',
      'harvest-collection-v1',
    );
    this.logger.log(`Using MATTR template ID: ${this.MATTR_TEMPLATE_ID}`);
  }

  /**
   * Create a new collection credential
   */
  async createCollectionCredential(
    dto: CreateCollectionCredentialDto,
  ): Promise<CollectionCredentialResponseDto> {
    try {
      this.logger.log(`Creating collection credential for bin: ${dto.binIdentifier}`);

      // Generate Collection ID if not provided
      const collectionId =
        dto.collectionId || this.collectionIdGenerator.generateCollectionId();

      // Validate Collection ID format if provided
      if (dto.collectionId && !this.collectionIdGenerator.validateCollectionId(dto.collectionId)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid Collection ID format. Expected format: COL-YYYYMMDD-XXXXXX',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate harvest end datetime is after start datetime if provided
      if (dto.harvestEndDatetime) {
        const startDate = new Date(dto.harvestStartDatetime);
        const endDate = new Date(dto.harvestEndDatetime);
        if (endDate <= startDate) {
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Harvest end datetime must be after harvest start datetime',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Optionally validate organization part exists (if sessionId provided)
      if (dto.sessionId) {
        try {
          const orgParts = await this.organisationsService.getOrganisationParts(
            dto.nzbn,
            dto.sessionId,
          );
          // Check if orchard ID matches any organization part
          // For now, we'll just validate the NZBN exists
          // In a real scenario, you might want to validate the orchardId against custom-data
          this.logger.debug(`Validated NZBN ${dto.nzbn} has ${orgParts.length} organization parts`);
        } catch (error) {
          // If validation fails, log but don't block (OAuth might not be set up)
          this.logger.warn(
            `Could not validate organization part for NZBN ${dto.nzbn}: ${error.message}`,
          );
        }
      }

      // Prepare credential data for MATTR
      const credentialData = {
        binIdentifier: dto.binIdentifier,
        rowIdentifier: dto.rowIdentifier,
        harvestStartDatetime: dto.harvestStartDatetime,
        harvestEndDatetime: dto.harvestEndDatetime,
        pickerId: dto.pickerId,
        pickerName: dto.pickerName,
        nzbn: dto.nzbn,
        orchardId: dto.orchardId,
        collectionId: collectionId,
      };

      // Create credential via MATTR
      const createCredentialDto: CreateCredentialDto = {
        templateId: this.MATTR_TEMPLATE_ID,
        credentialData,
        recipientDid: dto.recipientDid,
        recipientEmail: dto.recipientEmail,
      };

      const mattrResponse = await this.issuanceService.createCredential(createCredentialDto);

      // Generate QR code if we have the encoded credential
      let qrCodeData: { qrcode: string; type?: string } | undefined;
      if (mattrResponse.encoded) {
        try {
          const qrCodeResponse = await this.issuanceService.generateCredentialQRCode(
            mattrResponse.encoded,
          );
          qrCodeData = {
            qrcode: qrCodeResponse.qrcode,
            type: qrCodeResponse.type,
          };
          this.logger.log(`QR code generated for credential: ${mattrResponse.id}`);
        } catch (error) {
          this.logger.warn(`Failed to generate QR code: ${error.message}`);
          // Don't fail credential creation if QR code generation fails
        }
      }

      // Store credential locally
      const credential: CollectionCredential = {
        id: mattrResponse.id,
        collectionId,
        binIdentifier: dto.binIdentifier,
        rowIdentifier: dto.rowIdentifier,
        harvestStartDatetime: dto.harvestStartDatetime,
        harvestEndDatetime: dto.harvestEndDatetime,
        pickerId: dto.pickerId,
        pickerName: dto.pickerName,
        nzbn: dto.nzbn,
        orchardId: dto.orchardId,
        recipientDid: dto.recipientDid,
        recipientEmail: dto.recipientEmail,
        status: (mattrResponse.status as 'pending' | 'issued' | 'failed') || 'pending',
        credentialId: mattrResponse.credentialId,
        issuanceUrl: mattrResponse.issuanceUrl,
        qrCode: qrCodeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      credentialsStorage.set(credential.id, credential);

      this.logger.log(`Collection credential created successfully: ${credential.id}`);

      return {
        ...credential,
        mattrResponse,
      };
    } catch (error) {
      this.logger.error(
        `Error creating collection credential: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create collection credential',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a collection credential by ID
   */
  async getCollectionCredential(id: string): Promise<CollectionCredentialResponseDto> {
    const credential = credentialsStorage.get(id);
    if (!credential) {
      throw new NotFoundException(`Collection credential with ID ${id} not found`);
    }

    // Get latest status from MATTR
    try {
      const status = await this.issuanceService.getCredentialStatus(id);
      credential.status = status.status as 'pending' | 'issued' | 'failed';
      credential.credentialId = status.credentialId;
      credentialsStorage.set(id, credential);
    } catch (error) {
      this.logger.warn(`Could not fetch status from MATTR for credential ${id}: ${error.message}`);
    }

    return credential;
  }

  /**
   * Update a collection credential
   */
  async updateCollectionCredential(
    id: string,
    dto: UpdateCollectionCredentialDto,
  ): Promise<CollectionCredentialResponseDto> {
    const credential = credentialsStorage.get(id);
    if (!credential) {
      throw new NotFoundException(`Collection credential with ID ${id} not found`);
    }

    // Validate harvest end datetime if provided
    if (dto.harvestEndDatetime) {
      const startDate = new Date(credential.harvestStartDatetime);
      const endDate = new Date(dto.harvestEndDatetime);
      if (endDate <= startDate) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Harvest end datetime must be after harvest start datetime',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Update fields
    if (dto.harvestEndDatetime !== undefined) {
      credential.harvestEndDatetime = dto.harvestEndDatetime;
    }
    if (dto.recipientDid !== undefined) {
      credential.recipientDid = dto.recipientDid;
    }
    if (dto.recipientEmail !== undefined) {
      credential.recipientEmail = dto.recipientEmail;
    }
    credential.updatedAt = new Date();

    credentialsStorage.set(id, credential);

    this.logger.log(`Collection credential updated: ${id}`);
    return credential;
  }

  /**
   * List collection credentials with optional filters
   */
  async listCollectionCredentials(
    filters?: CollectionCredentialFilters,
  ): Promise<CollectionCredentialResponseDto[]> {
    let credentials = Array.from(credentialsStorage.values());

    // Apply filters
    if (filters) {
      if (filters.nzbn) {
        credentials = credentials.filter((c) => c.nzbn === filters.nzbn);
      }
      if (filters.orchardId) {
        credentials = credentials.filter((c) => c.orchardId === filters.orchardId);
      }
      if (filters.pickerId) {
        credentials = credentials.filter((c) => c.pickerId === filters.pickerId);
      }
      if (filters.status) {
        credentials = credentials.filter((c) => c.status === filters.status);
      }
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        credentials = credentials.filter(
          (c) => new Date(c.harvestStartDatetime) >= startDate,
        );
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        credentials = credentials.filter(
          (c) => new Date(c.harvestStartDatetime) <= endDate,
        );
      }
    }

    // Sort by creation date (newest first)
    credentials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return credentials;
  }

  /**
   * Issue a collection credential via MATTR
   */
  async issueCollectionCredential(id: string): Promise<CollectionCredentialResponseDto> {
    const credential = credentialsStorage.get(id);
    if (!credential) {
      throw new NotFoundException(`Collection credential with ID ${id} not found`);
    }

    if (!credential.credentialId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Credential ID not found. Cannot issue credential.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const mattrResponse = await this.issuanceService.issueCredential(credential.credentialId);
      credential.status = (mattrResponse.status as 'pending' | 'issued' | 'failed') || 'pending';
      credential.credentialId = mattrResponse.credentialId;
      credential.updatedAt = new Date();

      credentialsStorage.set(id, credential);

      this.logger.log(`Collection credential issued: ${id}`);
      return {
        ...credential,
        mattrResponse,
      };
    } catch (error) {
      this.logger.error(`Error issuing collection credential: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to issue collection credential with MATTR platform',
          error: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
