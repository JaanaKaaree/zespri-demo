import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ISession, ISessionStore } from './interfaces/session.interface';

@Injectable()
export class SessionService implements ISessionStore, OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private storeType: string;
  private memoryStore: Map<string, ISession> = new Map();
  private ttl: number;

  constructor(private configService: ConfigService) {
    this.storeType = this.configService.get<string>('session.storeType', 'redis');
    this.ttl = this.configService.get<number>('session.ttl', 3600);

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
        console.log('Redis session store connected');
      });
      this.redisClient.on('error', (err) => {
        console.error('Redis session store error:', err);
      });
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  async get(sessionId: string): Promise<ISession | null> {
    if (this.storeType === 'redis' && this.redisClient) {
      const data = await this.redisClient.get(`session:${sessionId}`);
      if (!data) {
        return null;
      }
      try {
        const session = JSON.parse(data);
        // Check if session has expired (in case TTL wasn't set or expired)
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
          // Clean up expired session
          await this.redisClient.del(`session:${sessionId}`);
          return null;
        }
        return session;
      } catch (error) {
        console.error(`Error parsing session data for ${sessionId}:`, error);
        return null;
      }
    } else {
      const session = this.memoryStore.get(sessionId);
      if (session && session.expiresAt > new Date()) {
        return session;
      }
      if (session) {
        this.memoryStore.delete(sessionId);
      }
      return null;
    }
  }

  async set(sessionId: string, session: ISession, ttl?: number): Promise<void> {
    const sessionTtl = ttl || this.ttl;

    if (this.storeType === 'redis' && this.redisClient) {
      await this.redisClient.setex(
        `session:${sessionId}`,
        sessionTtl,
        JSON.stringify(session),
      );
    } else {
      const expiresAt = new Date(Date.now() + sessionTtl * 1000);
      this.memoryStore.set(sessionId, { ...session, expiresAt });
      
      // Clean up expired sessions from memory
      setTimeout(() => {
        this.memoryStore.delete(sessionId);
      }, sessionTtl * 1000);
    }
  }

  async delete(sessionId: string): Promise<void> {
    if (this.storeType === 'redis' && this.redisClient) {
      await this.redisClient.del(`session:${sessionId}`);
    } else {
      this.memoryStore.delete(sessionId);
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    if (this.storeType === 'redis' && this.redisClient) {
      const exists = await this.redisClient.exists(`session:${sessionId}`);
      return exists === 1;
    } else {
      const session = this.memoryStore.get(sessionId);
      return session ? session.expiresAt > new Date() : false;
    }
  }
}
