import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IssuanceService } from '../../issuance.service';
import { DeliveryIdGeneratorService } from './delivery-id-generator.service';
import { OrganisationsService } from '../../../nzbn/organisations/organisations.service';
import { CreateDeliveryCredentialDto } from '../dto/create-delivery-credential.dto';
import { UpdateDeliveryCredentialDto } from '../dto/update-delivery-credential.dto';
import { DeliveryCredentialResponseDto } from '../dto/delivery-credential-response.dto';
import {
  DeliveryCredential,
  DeliveryCredentialFilters,
} from '../interfaces/delivery-credential.interface';
import { CreateCredentialDto } from '../../dto/create-credential.dto';
import { DeliveryCredentialRepository } from '../repositories/delivery-credential.repository';

@Injectable()
export class DeliveryCredentialService {
  private readonly logger = new Logger(DeliveryCredentialService.name);
  private readonly MATTR_TEMPLATE_ID: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly issuanceService: IssuanceService,
    private readonly deliveryIdGenerator: DeliveryIdGeneratorService,
    private readonly organisationsService: OrganisationsService,
    private readonly repository: DeliveryCredentialRepository,
  ) {
    this.MATTR_TEMPLATE_ID = this.configService.get<string>(
      'matt.deliveryCredentialTemplateId',
      'delivery-v1',
    );
    this.logger.log(`Using MATTR template ID: ${this.MATTR_TEMPLATE_ID}`);
  }

  /**
   * Create a new delivery credential
   */
  async createDeliveryCredential(
    dto: CreateDeliveryCredentialDto,
  ): Promise<DeliveryCredentialResponseDto> {
    try {
      this.logger.log(`Creating delivery credential from ${dto.originAddress} to ${dto.destinationAddress}`);

      // Generate Delivery ID if not provided
      const deliveryId =
        dto.deliveryId || await this.deliveryIdGenerator.generateDeliveryId();

      // Validate Delivery ID format if provided
      if (dto.deliveryId && !this.deliveryIdGenerator.validateDeliveryId(dto.deliveryId)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid Delivery ID format. Expected format: DEL-YYYYMMDD-XXXXXX',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate delivery end datetime is after start datetime if provided
      if (dto.deliveryEndDatetime) {
        const startDate = new Date(dto.deliveryStartDatetime);
        const endDate = new Date(dto.deliveryEndDatetime);
        if (endDate <= startDate) {
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Delivery end datetime must be after delivery start datetime',
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
        deliveryId: deliveryId,
        originAddress: dto.originAddress,
        destinationAddress: dto.destinationAddress,
        deliveryStartDatetime: dto.deliveryStartDatetime,
        deliveryEndDatetime: dto.deliveryEndDatetime,
        driverId: dto.driverId,
        driverName: dto.driverName,
        vehicleId: dto.vehicleId,
        collectionId: dto.collectionId,
        nzbn: dto.nzbn,
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
      const credential: DeliveryCredential = {
        id: mattrResponse.id,
        deliveryId,
        originAddress: dto.originAddress,
        destinationAddress: dto.destinationAddress,
        deliveryStartDatetime: dto.deliveryStartDatetime,
        deliveryEndDatetime: dto.deliveryEndDatetime,
        driverId: dto.driverId,
        driverName: dto.driverName,
        vehicleId: dto.vehicleId,
        collectionId: dto.collectionId,
        nzbn: dto.nzbn,
        recipientDid: dto.recipientDid,
        recipientEmail: dto.recipientEmail,
        status: (mattrResponse.status as 'pending' | 'issued' | 'failed') || 'pending',
        credentialId: mattrResponse.credentialId,
        issuanceUrl: mattrResponse.issuanceUrl,
        qrCode: qrCodeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store credential in database
      await this.repository.create(credential);

      this.logger.log(`Delivery credential created successfully: ${credential.id}`);

      return {
        ...credential,
        mattrResponse,
      };
    } catch (error) {
      this.logger.error(
        `Error creating delivery credential: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create delivery credential',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a delivery credential by ID
   */
  async getDeliveryCredential(id: string): Promise<DeliveryCredentialResponseDto> {
    const credential = await this.repository.findById(id);
    if (!credential) {
      throw new NotFoundException(`Delivery credential with ID ${id} not found`);
    }

    // Get latest status from MATTR
    try {
      const status = await this.issuanceService.getCredentialStatus(id);
      const updatedCredential = await this.repository.update(id, {
        status: status.status as 'pending' | 'issued' | 'failed',
        credentialId: status.credentialId,
      });
      return updatedCredential;
    } catch (error) {
      this.logger.warn(`Could not fetch status from MATTR for credential ${id}: ${error.message}`);
      return credential;
    }
  }

  /**
   * Update a delivery credential
   */
  async updateDeliveryCredential(
    id: string,
    dto: UpdateDeliveryCredentialDto,
  ): Promise<DeliveryCredentialResponseDto> {
    const credential = await this.repository.findById(id);
    if (!credential) {
      throw new NotFoundException(`Delivery credential with ID ${id} not found`);
    }

    // Validate delivery end datetime if provided
    if (dto.deliveryEndDatetime) {
      const startDate = new Date(credential.deliveryStartDatetime);
      const endDate = new Date(dto.deliveryEndDatetime);
      if (endDate <= startDate) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Delivery end datetime must be after delivery start datetime',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Update fields in database
    const updatedCredential = await this.repository.update(id, {
      deliveryEndDatetime: dto.deliveryEndDatetime,
      recipientDid: dto.recipientDid,
      recipientEmail: dto.recipientEmail,
    });

    this.logger.log(`Delivery credential updated: ${id}`);
    return updatedCredential;
  }

  /**
   * List delivery credentials with optional filters
   */
  async listDeliveryCredentials(
    filters?: DeliveryCredentialFilters,
  ): Promise<DeliveryCredentialResponseDto[]> {
    // Repository handles filtering and sorting
    return await this.repository.findMany(filters);
  }

  /**
   * Issue a delivery credential via MATTR
   */
  async issueDeliveryCredential(id: string): Promise<DeliveryCredentialResponseDto> {
    const credential = await this.repository.findById(id);
    if (!credential) {
      throw new NotFoundException(`Delivery credential with ID ${id} not found`);
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
      // CWT credentials are issued immediately when created, so just update status
      const updatedCredential = await this.repository.update(id, {
        status: 'issued',
      });

      this.logger.log(`Delivery credential status updated to issued: ${id}`);
      return updatedCredential;
    } catch (error) {
      this.logger.error(`Error issuing delivery credential: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to issue delivery credential with MATTR platform',
          error: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
