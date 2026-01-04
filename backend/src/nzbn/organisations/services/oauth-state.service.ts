import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * Service to manage OAuth state parameter mappings
 * Stores state -> sessionId mapping with short TTL for CSRF protection
 */
@Injectable()
export class OAuthStateService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis | null = null;
  private memoryStore: Map<string, { sessionId: string; expiresAt: number }> = new Map();
  private storeType: string;
  private ttl = 600; // 10 minutes

  constructor(private configService: ConfigService) {
    this.storeType = this.configService.get<string>('session.storeType', 'redis');

    if (this.storeType === 'redis') {
      this.redisClient = new Redis({
        host: this.configService.get<string>('redis.host', 'localhost'),
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password'),
        db: this.configService.get<number>('redis.db', 0),
      });
    }
  }

  async onModuleInit() {
    if (this.storeType === 'redis' && this.redisClient) {
      this.redisClient.on('connect', () => {
        console.log('Redis OAuth state store connected');
      });
      this.redisClient.on('error', (err) => {
        console.error('Redis OAuth state store error:', err);
      });
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * Store state -> sessionId mapping
   */
  async setState(state: string, sessionId: string): Promise<void> {
    console.log(`[OAuthStateService] Storing state: ${state} for sessionId: ${sessionId}`);
    console.log(`[OAuthStateService] Store type: ${this.storeType}`);
    if (this.storeType === 'redis' && this.redisClient) {
      const key = `oauth_state:${state}`;
      console.log(`[OAuthStateService] Storing in Redis with key: ${key}, TTL: ${this.ttl}s`);
      await this.redisClient.setex(key, this.ttl, sessionId);
      // Verify it was stored
      const stored = await this.redisClient.get(key);
      console.log(`[OAuthStateService] Verified stored value: ${stored}`);
    } else {
      const expiresAt = Date.now() + this.ttl * 1000;
      console.log(`[OAuthStateService] Storing in memory, expires at: ${new Date(expiresAt).toISOString()}`);
      this.memoryStore.set(state, { sessionId, expiresAt });
      console.log(`[OAuthStateService] Memory store size: ${this.memoryStore.size}`);

      // Clean up expired entries
      setTimeout(() => {
        this.memoryStore.delete(state);
      }, this.ttl * 1000);
    }
  }

  /**
   * Get sessionId from state
   */
  async getSessionId(state: string): Promise<string | null> {
    console.log(`[OAuthStateService] Retrieving state: ${state}`);
    console.log(`[OAuthStateService] Store type: ${this.storeType}`);
    if (this.storeType === 'redis' && this.redisClient) {
      const key = `oauth_state:${state}`;
      console.log(`[OAuthStateService] Looking up in Redis with key: ${key}`);
      const sessionId = await this.redisClient.get(key);
      console.log(`[OAuthStateService] Found in Redis: ${sessionId || 'NOT FOUND'}`);
      if (sessionId) {
        // Delete after use (one-time use)
        await this.redisClient.del(key);
        console.log(`[OAuthStateService] Deleted state from Redis after use`);
      } else {
        // Check if key exists with different pattern
        const keys = await this.redisClient.keys('oauth_state:*');
        console.log(`[OAuthStateService] Available state keys in Redis: ${keys.length} keys`);
        if (keys.length > 0) {
          console.log(`[OAuthStateService] First few keys: ${keys.slice(0, 5).join(', ')}`);
        }
      }
      return sessionId;
    } else {
      console.log(`[OAuthStateService] Looking up in memory store, size: ${this.memoryStore.size}`);
      const entry = this.memoryStore.get(state);
      if (entry) {
        console.log(`[OAuthStateService] Found entry, expiresAt: ${new Date(entry.expiresAt).toISOString()}, now: ${new Date().toISOString()}`);
        if (entry.expiresAt > Date.now()) {
          this.memoryStore.delete(state); // Delete after use
          console.log(`[OAuthStateService] Returning sessionId and deleting from memory`);
          return entry.sessionId;
        } else {
          console.log(`[OAuthStateService] Entry expired`);
          this.memoryStore.delete(state); // Clean up expired
        }
      } else {
        console.log(`[OAuthStateService] Entry not found in memory store`);
        const keys = Array.from(this.memoryStore.keys());
        console.log(`[OAuthStateService] Available state keys in memory: ${keys.length} keys`);
        if (keys.length > 0) {
          console.log(`[OAuthStateService] First few keys: ${keys.slice(0, 5).join(', ')}`);
        }
      }
      return null;
    }
  }
}
