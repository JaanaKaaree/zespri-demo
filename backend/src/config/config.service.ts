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

  get nzbnApiUrl(): string {
    return this.configService.get<string>('nzbn.apiUrl', 'https://api.business.govt.nz/sandbox');
  }

  get nzbnSubscriptionKey(): string {
    return this.configService.get<string>('nzbn.subscriptionKey', '');
  }

  get nzbnOAuthAuthorizeUrl(): string {
    return this.configService.get<string>(
      'nzbn.oauth.authorizeUrl',
      'https://api.business.govt.nz/oauth2/v2.0/authorize',
    );
  }

  get nzbnOAuthTokenUrl(): string {
    return this.configService.get<string>(
      'nzbn.oauth.tokenUrl',
      'https://api.business.govt.nz/oauth2/v2.0/token',
    );
  }

  get nzbnOAuthClientId(): string {
    return this.configService.get<string>('nzbn.oauth.clientId', '');
  }

  get nzbnOAuthClientSecret(): string {
    return this.configService.get<string>('nzbn.oauth.clientSecret', '');
  }

  get nzbnOAuthRedirectUri(): string {
    return this.configService.get<string>(
      'nzbn.oauth.redirectUri',
      'http://localhost:3000/nzbn/oauth/callback',
    );
  }

  get nzbnOAuthScope(): string {
    return this.configService.get<string>(
      'nzbn.oauth.scope',
      'https://api.business.govt.nz/sandbox/NZBNCO:manage offline_access',
    );
  }

  get nzbnOAuthPolicy(): string {
    return this.configService.get<string>('nzbn.oauth.policy', 'b2c_1a_api_consent_susi');
  }
}
