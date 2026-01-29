import { Injectable, Logger } from '@nestjs/common';
import { DeliveryCredentialRepository } from '../repositories/delivery-credential.repository';

/**
 * Service to generate Delivery IDs in format: DEL-YYYYMMDD-XXXXXX
 * Ensures uniqueness by checking existing IDs in the database
 */
@Injectable()
export class DeliveryIdGeneratorService {
  private readonly logger = new Logger(DeliveryIdGeneratorService.name);

  constructor(
    private readonly repository: DeliveryCredentialRepository,
  ) {}

  /**
   * Generate a new Delivery ID
   * Format: DEL-YYYYMMDD-XXXXXX
   * @returns Delivery ID string
   */
  async generateDeliveryId(): Promise<string> {
    const today = new Date();
    const dateStr = this.formatDate(today);
    const datePrefix = `DEL-${dateStr}-`;

    // Query database for existing IDs with this date prefix
    const maxSequence = await this.getMaxSequenceForDate(datePrefix);
    
    // Increment from max sequence found
    const nextSequence = maxSequence + 1;

    // Format sequence as 6-digit number (000001-999999)
    const sequenceStr = nextSequence.toString().padStart(6, '0');

    const deliveryId = `${datePrefix}${sequenceStr}`;
    this.logger.debug(`Generated Delivery ID: ${deliveryId}`);
    
    return deliveryId;
  }

  /**
   * Get the maximum sequence number for a given date prefix
   * @param datePrefix Format: DEL-YYYYMMDD-
   * @returns Maximum sequence number found, or 0 if none found
   */
  private async getMaxSequenceForDate(datePrefix: string): Promise<number> {
    try {
      // Get all delivery IDs that start with the date prefix
      const credentials = await this.repository.findMany();
      const matchingIds = credentials
        .map(c => c.deliveryId)
        .filter(id => id && id.startsWith(datePrefix));

      if (matchingIds.length === 0) {
        return 0;
      }

      // Extract sequence numbers and find the maximum
      const sequences = matchingIds
        .map(id => {
          const parts = id.split('-');
          if (parts.length === 3) {
            const seqStr = parts[2];
            const seqNum = parseInt(seqStr, 10);
            return isNaN(seqNum) ? 0 : seqNum;
          }
          return 0;
        })
        .filter(seq => seq > 0);

      return sequences.length > 0 ? Math.max(...sequences) : 0;
    } catch (error) {
      this.logger.warn(`Error querying database for existing IDs: ${error.message}. Starting from sequence 0.`);
      return 0;
    }
  }

  /**
   * Format date as YYYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Validate Delivery ID format
   * @param deliveryId Delivery ID to validate
   * @returns true if valid format
   */
  validateDeliveryId(deliveryId: string): boolean {
    const pattern = /^DEL-\d{8}-\d{6}$/;
    return pattern.test(deliveryId);
  }
}
