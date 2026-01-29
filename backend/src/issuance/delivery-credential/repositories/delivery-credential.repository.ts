import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import {
  DeliveryCredential,
  DeliveryCredentialFilters,
} from '../interfaces/delivery-credential.interface';

@Injectable()
export class DeliveryCredentialRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryCredentialRepository.name);
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
   * Create a new delivery credential
   */
  async create(credential: DeliveryCredential): Promise<DeliveryCredential> {
    const query = `
      INSERT INTO delivery_credentials (
        id, delivery_id, origin_address, destination_address,
        delivery_start_datetime, delivery_end_datetime,
        driver_id, driver_name, vehicle_id, collection_id,
        nzbn, recipient_did, recipient_email, status,
        credential_id, issuance_url, qr_code,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      RETURNING *
    `;

    const values = [
      credential.id,
      credential.deliveryId,
      credential.originAddress,
      credential.destinationAddress,
      credential.deliveryStartDatetime,
      credential.deliveryEndDatetime || null,
      credential.driverId,
      credential.driverName,
      credential.vehicleId,
      credential.collectionId || null,
      credential.nzbn,
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
   * Find a delivery credential by ID
   */
  async findById(id: string): Promise<DeliveryCredential | null> {
    const query = 'SELECT * FROM delivery_credentials WHERE id = $1';
    const result = await this.client.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCredential(result.rows[0]);
  }

  /**
   * Find a delivery credential by delivery ID
   */
  async findByDeliveryId(deliveryId: string): Promise<DeliveryCredential | null> {
    const query = 'SELECT * FROM delivery_credentials WHERE delivery_id = $1';
    const result = await this.client.query(query, [deliveryId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCredential(result.rows[0]);
  }

  /**
   * Update a delivery credential
   */
  async update(
    id: string,
    updates: Partial<DeliveryCredential>,
  ): Promise<DeliveryCredential> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.deliveryEndDatetime !== undefined) {
      updateFields.push(`delivery_end_datetime = $${paramIndex++}`);
      values.push(updates.deliveryEndDatetime || null);
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
      UPDATE delivery_credentials
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.client.query(query, values);
    return this.mapRowToCredential(result.rows[0]);
  }

  /**
   * Find delivery credentials with filters
   */
  async findMany(filters?: DeliveryCredentialFilters): Promise<DeliveryCredential[]> {
    let query = 'SELECT * FROM delivery_credentials WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters) {
      if (filters.nzbn) {
        query += ` AND nzbn = $${paramIndex++}`;
        values.push(filters.nzbn);
      }
      if (filters.driverId) {
        query += ` AND driver_id = $${paramIndex++}`;
        values.push(filters.driverId);
      }
      if (filters.vehicleId) {
        query += ` AND vehicle_id = $${paramIndex++}`;
        values.push(filters.vehicleId);
      }
      if (filters.collectionId) {
        query += ` AND collection_id = $${paramIndex++}`;
        values.push(filters.collectionId);
      }
      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
      }
      if (filters.startDate) {
        query += ` AND delivery_start_datetime >= $${paramIndex++}`;
        values.push(filters.startDate);
      }
      if (filters.endDate) {
        query += ` AND delivery_start_datetime <= $${paramIndex++}`;
        values.push(filters.endDate);
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.client.query(query, values);
    return result.rows.map((row) => this.mapRowToCredential(row));
  }

  /**
   * Map database row to DeliveryCredential interface
   */
  private mapRowToCredential(row: any): DeliveryCredential {
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
      deliveryId: row.delivery_id,
      originAddress: row.origin_address,
      destinationAddress: row.destination_address,
      deliveryStartDatetime: row.delivery_start_datetime,
      deliveryEndDatetime: row.delivery_end_datetime || undefined,
      driverId: row.driver_id,
      driverName: row.driver_name,
      vehicleId: row.vehicle_id,
      collectionId: row.collection_id || undefined,
      nzbn: row.nzbn,
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
