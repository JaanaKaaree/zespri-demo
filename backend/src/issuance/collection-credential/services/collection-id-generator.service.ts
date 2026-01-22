import { Injectable, Logger } from '@nestjs/common';

/**
 * Service to generate Collection IDs in format: COL-YYYYMMDD-XXXXXX
 * For demo purposes, uses in-memory counter with date-based reset
 * For production, should use Redis or database for sequence management
 */
@Injectable()
export class CollectionIdGeneratorService {
  private readonly logger = new Logger(CollectionIdGeneratorService.name);
  private currentDate: string;
  private sequence: number = 0;

  /**
   * Generate a new Collection ID
   * Format: COL-YYYYMMDD-XXXXXX
   * @returns Collection ID string
   */
  generateCollectionId(): string {
    const today = new Date();
    const dateStr = this.formatDate(today);

    // Reset sequence if date changed
    if (this.currentDate !== dateStr) {
      this.logger.log(`Date changed, resetting sequence. Old date: ${this.currentDate}, New date: ${dateStr}`);
      this.currentDate = dateStr;
      this.sequence = 0;
    }

    // Increment sequence
    this.sequence += 1;

    // Format sequence as 6-digit number (000001-999999)
    const sequenceStr = this.sequence.toString().padStart(6, '0');

    const collectionId = `COL-${dateStr}-${sequenceStr}`;
    this.logger.debug(`Generated Collection ID: ${collectionId}`);
    
    return collectionId;
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
   * Validate Collection ID format
   * @param collectionId Collection ID to validate
   * @returns true if valid format
   */
  validateCollectionId(collectionId: string): boolean {
    const pattern = /^COL-\d{8}-\d{6}$/;
    return pattern.test(collectionId);
  }
}
