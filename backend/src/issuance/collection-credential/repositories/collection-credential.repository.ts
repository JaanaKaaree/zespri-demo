import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import {
  CollectionCredential,
  CollectionCredentialFilters,
} from '../interfaces/collection-credential.interface';

@Injectable()
export class CollectionCredentialRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollectionCredentialRepository.name);
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
   * Create a new collection credential
   */
  async create(credential: CollectionCredential): Promise<CollectionCredential> {
    const query = `
      INSERT INTO collection_credentials (
        id, collection_id, bin_identifier, row_identifier,
        harvest_start_datetime, harvest_end_datetime,
        picker_id, picker_name, nzbn, orchard_id,
        recipient_did, recipient_email, status,
        credential_id, issuance_url, qr_code,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `;

    const values = [
      credential.id,
      credential.collectionId,
      credential.binIdentifier,
      credential.rowIdentifier,
      credential.harvestStartDatetime,
      credential.harvestEndDatetime || null,
      credential.pickerId,
      credential.pickerName,
      credential.nzbn,
      credential.orchardId,
      credential.recipientDid || null,
      credential.recipientEmail || null,
      credential.status,
      credential.credentialId || null,
      credential.issuanceUrl || null,
      credential.qrCode ? JSON.stringify(credential.qrCode) : null,
      credential.createdAt,
      credential.updatedAt,
    ];

    const result = await this.client.query(query, values);
    return this.mapRowToCredential(result.rows[0]);
  }

  /**
   * Find a collection credential by ID
   */
  async findById(id: string): Promise<CollectionCredential | null> {
    const query = 'SELECT * FROM collection_credentials WHERE id = $1';
    const result = await this.client.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCredential(result.rows[0]);
  }

  /**
   * Update a collection credential
   */
  async update(
    id: string,
    updates: Partial<CollectionCredential>,
  ): Promise<CollectionCredential> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.harvestEndDatetime !== undefined) {
      updateFields.push(`harvest_end_datetime = $${paramIndex++}`);
      values.push(updates.harvestEndDatetime || null);
    }
    if (updates.recipientDid !== undefined) {
      updateFields.push(`recipient_did = $${paramIndex++}`);
      values.push(updates.recipientDid || null);
    }
    if (updates.recipientEmail !== undefined) {
      updateFields.push(`recipient_email = $${paramIndex++}`);
      values.push(updates.recipientEmail || null);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.credentialId !== undefined) {
      updateFields.push(`credential_id = $${paramIndex++}`);
      values.push(updates.credentialId || null);
    }
    if (updates.issuanceUrl !== undefined) {
      updateFields.push(`issuance_url = $${paramIndex++}`);
      values.push(updates.issuanceUrl || null);
    }
    if (updates.qrCode !== undefined) {
      updateFields.push(`qr_code = $${paramIndex++}`);
      values.push(updates.qrCode ? JSON.stringify(updates.qrCode) : null);
    }

    // Always update updated_at
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    // Add id to values for WHERE clause
    values.push(id);

    const query = `
      UPDATE collection_credentials
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.client.query(query, values);
    return this.mapRowToCredential(result.rows[0]);
  }

  /**
   * Find collection credentials with filters
   */
  async findMany(filters?: CollectionCredentialFilters): Promise<CollectionCredential[]> {
    let query = 'SELECT * FROM collection_credentials WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters) {
      if (filters.nzbn) {
        query += ` AND nzbn = $${paramIndex++}`;
        values.push(filters.nzbn);
      }
      if (filters.orchardId) {
        query += ` AND orchard_id = $${paramIndex++}`;
        values.push(filters.orchardId);
      }
      if (filters.pickerId) {
        query += ` AND picker_id = $${paramIndex++}`;
        values.push(filters.pickerId);
      }
      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
      }
      if (filters.startDate) {
        query += ` AND harvest_start_datetime >= $${paramIndex++}`;
        values.push(filters.startDate);
      }
      if (filters.endDate) {
        query += ` AND harvest_start_datetime <= $${paramIndex++}`;
        values.push(filters.endDate);
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.client.query(query, values);
    return result.rows.map((row) => this.mapRowToCredential(row));
  }

  /**
   * Map database row to CollectionCredential interface
   */
  private mapRowToCredential(row: any): CollectionCredential {
    // Handle qr_code - PostgreSQL JSONB can be object or string
    let qrCode: { qrcode: string; type?: string } | undefined;
    if (row.qr_code) {
      if (typeof row.qr_code === 'string') {
        qrCode = JSON.parse(row.qr_code);
      } else {
        qrCode = row.qr_code;
      }
    }

    return {
      id: row.id,
      collectionId: row.collection_id,
      binIdentifier: row.bin_identifier,
      rowIdentifier: row.row_identifier,
      harvestStartDatetime: row.harvest_start_datetime,
      harvestEndDatetime: row.harvest_end_datetime || undefined,
      pickerId: row.picker_id,
      pickerName: row.picker_name,
      nzbn: row.nzbn,
      orchardId: row.orchard_id,
      recipientDid: row.recipient_did || undefined,
      recipientEmail: row.recipient_email || undefined,
      status: row.status,
      credentialId: row.credential_id || undefined,
      issuanceUrl: row.issuance_url || undefined,
      qrCode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
