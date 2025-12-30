import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { ISession } from '../session/interfaces/session.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionService: SessionService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const sessionId = uuidv4();

    const session: ISession = {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
      expiresAt: new Date(
        Date.now() +
          this.configService.get<number>('session.ttl', 3600) * 1000,
      ),
      data: {
        name: user.name,
      },
    };

    await this.sessionService.set(sessionId, session);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async logout(sessionId: string) {
    await this.sessionService.delete(sessionId);
    return { success: true };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
