import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`JwtAuthGuard.canActivate called for ${request.method} ${request.url}`);
    this.logger.log(`Authorization header: ${request.headers.authorization ? 'Present' : 'Missing'}`);
    if (request.headers.authorization) {
      this.logger.log(`Authorization header value: ${request.headers.authorization.substring(0, 30)}...`);
    }
    this.logger.log(`All request headers: ${JSON.stringify(Object.keys(request.headers))}`);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.logger.log('Route is public, allowing access');
      return true;
    }
    this.logger.log('Route requires authentication, calling super.canActivate');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`JwtAuthGuard.handleRequest called for ${request.method} ${request.url}`);
    if (err) {
      this.logger.error(`JwtAuthGuard error: ${err.message}`, err.stack);
    }
    if (info) {
      this.logger.warn(`JwtAuthGuard info: ${JSON.stringify(info)}`);
    }
    if (user) {
      this.logger.log(`JwtAuthGuard user authenticated: ${JSON.stringify(user)}`);
    } else {
      this.logger.warn('JwtAuthGuard no user found');
    }
    return super.handleRequest(err, user, info, context);
  }
}
