import { Injectable, Logger } from '@nestjs/common';
import { IssuanceService } from '../../issuance.service';
import { VerificationRepository } from '../repositories/verification.repository';
import { DeliveryCredentialRepository } from '../../delivery-credential/repositories/delivery-credential.repository';
import { CollectionCredentialRepository } from '../../collection-credential/repositories/collection-credential.repository';
import {
  CredentialType,
} from '../interfaces/verification.interface';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly verificationRepository: VerificationRepository,
    private readonly issuanceService: IssuanceService,
    private readonly deliveryCredentialRepository: DeliveryCredentialRepository,
    private readonly collectionCredentialRepository: CollectionCredentialRepository,
  ) {}

  /**
   * Detect credential type from decoded credential data
   */
  detectCredentialType(decoded: any): CredentialType | null {
    this.logger.log('🔍 Detecting credential type from decoded data');
    this.logger.log(`Decoded data keys: ${Object.keys(decoded || {}).join(', ')}`);
    
    if (!decoded || typeof decoded !== 'object') {
      this.logger.warn('Decoded data is not an object or is null');
      return null;
    }

    // Check for delivery credential identifier
    if (decoded.deliveryId) {
      this.logger.log(`✅ Detected credential type: delivery (deliveryId: ${decoded.deliveryId})`);
      return 'delivery';
    }

    // Check for collection credential identifier
    if (decoded.collectionId) {
      this.logger.log(`✅ Detected credential type: collection (collectionId: ${decoded.collectionId})`);
      return 'collection';
    }

    this.logger.warn('Could not detect credential type - no deliveryId or collectionId found');
    return null;
  }

  /**
   * Track a credential verification
   */
  async trackVerification(
    decoded: any,
    userId?: string,
    mobileAppId?: string,
    verified: boolean = true,
    providedCredentialType?: 'collection' | 'delivery',
  ): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('🔵 VERIFICATION SERVICE: trackVerification');
    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log(`User ID: ${userId || 'not provided'}`);
    this.logger.log(`Mobile Application ID: ${mobileAppId || 'not provided'}`);
    this.logger.log(`Verified: ${verified}`);
    if (providedCredentialType) {
      this.logger.log(`Credential Type (provided): ${providedCredentialType}`);
    }
    this.logger.log(`Decoded data keys: ${Object.keys(decoded || {}).join(', ')}`);
    
    try {
      // Detect credential type from decoded data
      this.logger.log('🔍 Starting credential type detection...');
      const detectedCredentialType = this.detectCredentialType(decoded);
      
      // Use provided credential type if available, otherwise use detected type
      let credentialType: CredentialType | null = providedCredentialType || detectedCredentialType;
      
      if (providedCredentialType && detectedCredentialType) {
        // Validate that provided type matches detected type
        if (providedCredentialType !== detectedCredentialType) {
          this.logger.warn(
            `⚠️ Credential type mismatch! Provided: ${providedCredentialType}, Detected: ${detectedCredentialType}. Using detected type.`,
          );
          credentialType = detectedCredentialType; // Trust the decoded data over the provided value
        } else {
          this.logger.log(`✅ Credential type matches: ${credentialType}`);
        }
      } else if (providedCredentialType && !detectedCredentialType) {
        this.logger.log(`ℹ️ Using provided credential type (could not detect from decoded data): ${providedCredentialType}`);
        credentialType = providedCredentialType;
      } else if (!providedCredentialType && detectedCredentialType) {
        this.logger.log(`ℹ️ Using detected credential type: ${detectedCredentialType}`);
        credentialType = detectedCredentialType;
      }

      if (!credentialType) {
        this.logger.warn(
          `Could not determine credential type from decoded data. Keys: ${Object.keys(decoded || {}).join(', ')}`,
        );
        // Still try to track with unknown type if we have a credential ID
        if (decoded.id || decoded.credentialId) {
          const credentialId = decoded.id || decoded.credentialId;
          this.logger.log(`📝 Creating verification record for unknown type credential: ${credentialId}`);
          await this.verificationRepository.create({
            credentialId: String(credentialId),
            credentialType: 'collection', // Default to collection for unknown types
            userId,
            mobileApplicationId: mobileAppId,
            verified,
            verifiedAt: new Date(),
          });
          this.logger.log(`✅ Verification record created for credential: ${credentialId}`);
        }
        this.logger.log('═══════════════════════════════════════════════════════════');
        this.logger.log('✅ VERIFICATION SERVICE COMPLETED: trackVerification (unknown type)');
        this.logger.log('═══════════════════════════════════════════════════════════');
        return;
      }

      // Find credential in database to get the MATTR credential ID
      let credentialId: string | null = null;

      if (credentialType === 'delivery') {
        const deliveryId = decoded.deliveryId;
        this.logger.log(`🔍 Looking up delivery credential by deliveryId: ${deliveryId}`);
        if (deliveryId) {
          this.logger.log(`📞 Calling deliveryCredentialRepository.findByDeliveryId(${deliveryId})`);
          const credential = await this.deliveryCredentialRepository.findByDeliveryId(
            String(deliveryId),
          );
          if (credential) {
            credentialId = credential.id; // MATTR credential ID
            this.logger.log(`✅ Found delivery credential: ${credentialId} for deliveryId: ${deliveryId}`);

            // Check if this is the first verification
            this.logger.log(`🔍 Checking if this is the first verification for credential: ${credentialId}`);
            this.logger.log(`📞 Calling verificationRepository.isFirstVerification(${credentialId})`);
            const isFirst = await this.verificationRepository.isFirstVerification(credentialId);
            this.logger.log(`First verification check result: ${isFirst}`);
          } else {
            this.logger.warn(`⚠️ Delivery credential not found in database for deliveryId: ${deliveryId}`);
            // Use decoded.id or decoded.credentialId as fallback
            credentialId = decoded.id || decoded.credentialId || null;
            if (credentialId) {
              this.logger.log(`Using fallback credential ID: ${credentialId}`);
            }
          }
        }
      } else if (credentialType === 'collection') {
        const collectionId = decoded.collectionId;
        this.logger.log(`🔍 Looking up collection credential by collectionId: ${collectionId}`);
        if (collectionId) {
          this.logger.log(`📞 Calling collectionCredentialRepository.findByCollectionId(${collectionId})`);
          const credential = await this.collectionCredentialRepository.findByCollectionId(
            String(collectionId),
          );
          if (credential) {
            credentialId = credential.id; // MATTR credential ID
            this.logger.log(`✅ Found collection credential: ${credentialId} for collectionId: ${collectionId}`);
          } else {
            this.logger.warn(`⚠️ Collection credential not found in database for collectionId: ${collectionId}`);
            // Use decoded.id or decoded.credentialId as fallback
            credentialId = decoded.id || decoded.credentialId || null;
            if (credentialId) {
              this.logger.log(`Using fallback credential ID: ${credentialId}`);
            }
          }
        }
      }

      // If we still don't have a credential ID, try to use decoded.id or decoded.credentialId
      if (!credentialId) {
        credentialId = decoded.id || decoded.credentialId || null;
        if (credentialId) {
          this.logger.log(`Using credential ID from decoded data: ${credentialId}`);
        }
      }

      // Create verification record
      if (credentialId) {
        this.logger.log(`📝 Creating verification record for ${credentialType} credential: ${credentialId}`);
        this.logger.log(`📞 Calling verificationRepository.create()`);
        this.logger.log(`   Credential ID: ${credentialId}`);
        this.logger.log(`   Credential Type: ${credentialType}`);
        this.logger.log(`   User ID: ${userId || 'null'}`);
        this.logger.log(`   Mobile App ID: ${mobileAppId || 'null'}`);
        this.logger.log(`   Verified: ${verified}`);
        
        await this.verificationRepository.create({
          credentialId: String(credentialId),
          credentialType,
          userId,
          mobileApplicationId: mobileAppId,
          verified,
          verifiedAt: new Date(),
        });
        
        this.logger.log(`✅ Verification tracked for ${credentialType} credential: ${credentialId}`);
        this.logger.log('═══════════════════════════════════════════════════════════');
        this.logger.log('✅ VERIFICATION SERVICE COMPLETED: trackVerification');
        this.logger.log('═══════════════════════════════════════════════════════════');
      } else {
        this.logger.warn(
          `⚠️ Could not determine credential ID for ${credentialType} credential. Skipping verification tracking.`,
        );
        this.logger.log('═══════════════════════════════════════════════════════════');
        this.logger.log('⚠️ VERIFICATION SERVICE COMPLETED: trackVerification (no credential ID)');
        this.logger.log('═══════════════════════════════════════════════════════════');
      }
    } catch (error) {
      // Log error but don't fail the verification response
      this.logger.error('═══════════════════════════════════════════════════════════');
      this.logger.error('❌ VERIFICATION SERVICE ERROR: trackVerification');
      this.logger.error('═══════════════════════════════════════════════════════════');
      this.logger.error(`Error tracking verification: ${error.message}`, error.stack);
      this.logger.error('═══════════════════════════════════════════════════════════');
    }
  }
}
