import { Controller, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { VerifyCredentialDto } from './dto/verify-credential.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';
import { VerificationService } from './verification/services/verification.service';
import { DeliveryCredentialRepository } from './delivery-credential/repositories/delivery-credential.repository';
import { CollectionCredentialRepository } from './collection-credential/repositories/collection-credential.repository';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1')
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(
    private readonly issuanceService: IssuanceService,
    private readonly verificationService: VerificationService,
    private readonly deliveryCredentialRepository: DeliveryCredentialRepository,
    private readonly collectionCredentialRepository: CollectionCredentialRepository,
  ) {}

  @Public()
  @Post('verify')
  async verifyCredential(@Body() verifyDto: VerifyCredentialDto) {
    this.logger.log('📥 Verification request received');
    this.logger.log(`Request body keys: ${Object.keys(verifyDto).join(', ')}`);
    this.logger.log(`Payload length: ${verifyDto.payload?.length || 0} chars`);
    if (verifyDto.user_id) {
      this.logger.log(`User ID: ${verifyDto.user_id}`);
    }
    if (verifyDto.mobile_application_id) {
      this.logger.log(`Mobile Application ID: ${verifyDto.mobile_application_id}`);
    }
    if (verifyDto.credential_type) {
      this.logger.log(`Credential Type (from request): ${verifyDto.credential_type}`);
    }
    
    if (!verifyDto.payload || typeof verifyDto.payload !== 'string') {
      this.logger.error('❌ Invalid request: payload is missing or not a string');
      throw new Error('payload must be a non-empty string');
    }
    
    const result = await this.issuanceService.verifyCredential(verifyDto.payload);
    
    // Validate credential exists in database if credential_type is provided
    if (result.decoded && result.verified && verifyDto.credential_type) {
      const credentialType = verifyDto.credential_type; // Keep original case for comparison
      let credentialFound = false;
      let credentialId: string | null = null;

      if (credentialType === 'DeliveryCredential') {
        credentialId = result.decoded.deliveryId;
        if (credentialId) {
          this.logger.log(`🔍 Validating delivery credential exists: ${credentialId}`);
          const credential = await this.deliveryCredentialRepository.findByDeliveryId(
            String(credentialId),
          );
          if (credential) {
            credentialFound = true;
            this.logger.log(`✅ Delivery credential found: ${credentialId}`);
          } else {
            this.logger.warn(`⚠️ Delivery credential not found: ${credentialId}`);
          }
        } else {
          this.logger.error(`❌ No deliveryId found in decoded credential data for DeliveryCredential type`);
        }
      } else if (credentialType === 'OrgPartHarvestCredential') {
        credentialId = result.decoded.collectionId;
        if (credentialId) {
          this.logger.log(`🔍 Validating OrgPartHarvestCredential exists: ${credentialId}`);
          const credential = await this.collectionCredentialRepository.findByCollectionId(
            String(credentialId),
          );
          if (credential) {
            credentialFound = true;
            this.logger.log(`✅ OrgPartHarvestCredential found: ${credentialId}`);
          } else {
            this.logger.warn(`⚠️ OrgPartHarvestCredential not found: ${credentialId}`);
          }
        } else {
          this.logger.error(`❌ No collectionId found in decoded credential data for OrgPartHarvestCredential type`);
        }
      } else {
        this.logger.warn(`⚠️ Unknown credential type: ${credentialType}. Skipping database validation.`);
      }

      // Throw error if credential ID is missing or credential not found in database
      // Only validate if we recognized the credential type
      if ((credentialType === 'DeliveryCredential' || credentialType === 'OrgPartHarvestCredential') && !credentialId) {
        this.logger.error(`❌ Credential type not found error: ${credentialType} credential ID missing in decoded data`);
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Credential type not found error`,
            error: `The ${credentialType} credential ID is missing in the decoded credential data`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if ((credentialType === 'DeliveryCredential' || credentialType === 'OrgPartHarvestCredential') && !credentialFound) {
        this.logger.error(`❌ Credential type not found error: ${credentialType} credential does not exist in database`);
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `Credential type not found error`,
            error: `The ${credentialType} credential with ID ${credentialId} does not exist in the database`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }
    
    // Track verification asynchronously (don't block response)
    if (result.decoded) {
      // Map mobile app credential type names to internal types
      let internalCredentialType: 'collection' | 'delivery' | undefined;
      if (verifyDto.credential_type === 'DeliveryCredential') {
        internalCredentialType = 'delivery';
      } else if (verifyDto.credential_type === 'OrgPartHarvestCredential') {
        internalCredentialType = 'collection';
      }

      this.verificationService
        .trackVerification(
          result.decoded,
          verifyDto.user_id,
          verifyDto.mobile_application_id,
          result.verified,
          internalCredentialType,
        )
        .catch((error) => {
          // Log error but don't fail the verification response
          this.logger.error(`Error tracking verification: ${error.message}`, error.stack);
        });
    }
    
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('📤 RETURNING TO REACT APP');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`Verified: ${result.verified}`);
    if (result.decoded) {
      this.logger.log(`Decoded data: ${JSON.stringify(result.decoded, null, 2)}`);
    }
    this.logger.log('═══════════════════════════════════════════════════════════');
    
    return result;
  }

  @Public()
  @Post('revoke')
  async revokeCredential(@Body() revokeDto: RevokeCredentialDto) {
    this.logger.log('📥 Revocation request received');
    this.logger.log(`Request body keys: ${Object.keys(revokeDto).join(', ')}`);
    this.logger.log(`Payload length: ${revokeDto.payload?.length || 0} chars`);
    if (revokeDto.credential_type) {
      this.logger.log(`Credential Type (from request): ${revokeDto.credential_type}`);
    }
    
    if (!revokeDto.payload || typeof revokeDto.payload !== 'string') {
      this.logger.error('❌ Invalid request: payload is missing or not a string');
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'payload must be a non-empty string',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify the credential first to decode it
    const verifyResult = await this.issuanceService.verifyCredential(revokeDto.payload);
    
    if (!verifyResult.decoded) {
      this.logger.error('❌ Failed to decode credential');
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to decode credential',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const credentialType = revokeDto.credential_type; // Keep original case for comparison
    let credentialId: string | null = null;

    // Find the MATTR credential ID based on credential type
    if (credentialType === 'DeliveryCredential') {
      const deliveryId = verifyResult.decoded.deliveryId;
      if (deliveryId) {
        this.logger.log(`🔍 Looking up delivery credential by deliveryId: ${deliveryId}`);
        const credential = await this.deliveryCredentialRepository.findByDeliveryId(
          String(deliveryId),
        );
        if (credential) {
          credentialId = credential.id; // MATTR credential ID
          this.logger.log(`✅ Found delivery credential: ${credentialId} for deliveryId: ${deliveryId}`);
        } else {
          this.logger.error(`❌ Delivery credential not found: ${deliveryId}`);
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: `Delivery credential not found`,
              error: `The delivery credential with ID ${deliveryId} does not exist in the database`,
            },
            HttpStatus.NOT_FOUND,
          );
        }
      } else {
        this.logger.error(`❌ No deliveryId found in decoded credential data`);
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'No deliveryId found in credential',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (credentialType === 'OrgPartHarvestCredential') {
      const collectionId = verifyResult.decoded.collectionId;
      if (collectionId) {
        this.logger.log(`🔍 Looking up collection credential by collectionId: ${collectionId}`);
        const credential = await this.collectionCredentialRepository.findByCollectionId(
          String(collectionId),
        );
        if (credential) {
          credentialId = credential.id; // MATTR credential ID
          this.logger.log(`✅ Found collection credential: ${credentialId} for collectionId: ${collectionId}`);
        } else {
          this.logger.error(`❌ Collection credential not found: ${collectionId}`);
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              message: `Collection credential not found`,
              error: `The collection credential with ID ${collectionId} does not exist in the database`,
            },
            HttpStatus.NOT_FOUND,
          );
        }
      } else {
        this.logger.error(`❌ No collectionId found in decoded credential data`);
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'No collectionId found in credential',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      // Try to use decoded.id or decoded.credentialId as fallback
      credentialId = verifyResult.decoded.id || verifyResult.decoded.credentialId || null;
      if (!credentialId) {
        this.logger.error(`❌ Could not determine credential ID`);
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Could not determine credential ID. Please provide credential_type.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Using credential ID from decoded data: ${credentialId}`);
    }

    // Revoke the credential
    try {
      this.logger.log(`🔒 Revoking credential: ${credentialId}`);
      await this.issuanceService.revokeCredential(credentialId);
      this.logger.log(`✅ Successfully revoked credential: ${credentialId}`);
      
      return {
        success: true,
        message: 'Credential revoked successfully',
        credentialId,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to revoke credential ${credentialId}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to revoke credential',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
