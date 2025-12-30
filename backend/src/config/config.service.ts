import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('port', 3001);
  }

  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret', 'your-secret-key');
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('jwt.expiresIn', '1d');
  }

  get redisHost(): string {
    return this.configService.get<string>('redis.host', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('redis.port', 6379);
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('redis.password');
  }

  get redisDb(): number {
    return this.configService.get<number>('redis.db', 0);
  }

  get sessionStoreType(): string {
    return this.configService.get<string>('session.storeType', 'redis');
  }

  get sessionTtl(): number {
    return this.configService.get<number>('session.ttl', 3600);
  }

  get mattApiUrl(): string {
    return this.configService.get<string>('matt.apiUrl', '');
  }

  get mattApiKey(): string {
    return this.configService.get<string>('matt.apiKey', '');
  }

  get logLevel(): string {
    return this.configService.get<string>('logging.level', 'info');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('frontend.url', 'http://localhost:3000');
  }
}
