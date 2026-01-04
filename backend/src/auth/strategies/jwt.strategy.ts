import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  sessionId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'your-secret-key'),
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.log(`JwtStrategy.validate called with payload: ${JSON.stringify(payload)}`);
    
    if (!payload.sub || !payload.email) {
      this.logger.error(`Invalid token payload: missing sub or email. Payload: ${JSON.stringify(payload)}`);
      throw new UnauthorizedException('Invalid token payload');
    }
    
    const user = {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      sessionId: payload.sessionId,
    };
    
    this.logger.log(`JwtStrategy.validate returning user: ${JSON.stringify(user)}`);
    return user;
  }
}
