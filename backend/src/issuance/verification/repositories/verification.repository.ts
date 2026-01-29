import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import {
  CredentialVerification,
  CredentialType,
} from '../interfaces/verification.interface';

@Injectable()
export class VerificationRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VerificationRepository.name);
  private client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      host: this.configService.get<string>('database.host', 'localhost'),
      port: this.configService.get<number>('database.port', 5432),
      user: this.configService.get<string>('database.user', 'credentials_app'),
      password: this.configService.get<string>('database.password', 'credentials_app'),
      database: this.configService.get<string>('database.name', 'credential_issuance'),
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('✅ Connected to PostgreSQL database');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.end();
    this.logger.log('Database connection closed');
  }

  /**
   * Create a new verification record
   */
  async create(verification: Omit<CredentialVerification, 'id' | 'createdAt'>): Promise<CredentialVerification> {
    const query = `
      INSERT INTO credential_verifications (
        credential_id, credential_type, user_id, mobile_application_id,
        verified, verified_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      verification.credentialId,
      verification.credentialType,
      verification.userId || null,
      verification.mobileApplicationId || null,
      verification.verified,
      verification.verifiedAt || new Date(),
      new Date(),
    ];

    const result = await this.client.query(query, values);
    return this.mapRowToVerification(result.rows[0]);
  }

  /**
   * Find all verifications for a credential ID
   */
  async findByCredentialId(credentialId: string): Promise<CredentialVerification[]> {
    const query = 'SELECT * FROM credential_verifications WHERE credential_id = $1 ORDER BY verified_at DESC';
    const result = await this.client.query(query, [credentialId]);

    return result.rows.map(row => this.mapRowToVerification(row));
  }

  /**
   * Check if this is the first verification for a credential
   */
  async isFirstVerification(credentialId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM credential_verifications
      WHERE credential_id = $1
    `;
    const result = await this.client.query(query, [credentialId]);
    const count = parseInt(result.rows[0].count, 10);
    return count === 0;
  }

  /**
   * Map database row to CredentialVerification interface
   */
  private mapRowToVerification(row: any): CredentialVerification {
    return {
      id: row.id,
      credentialId: row.credential_id,
      credentialType: row.credential_type as CredentialType,
      userId: row.user_id || undefined,
      mobileApplicationId: row.mobile_application_id || undefined,
      verified: row.verified,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
    };
  }
}
