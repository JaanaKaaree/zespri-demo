import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * OAuth Token Guard - ensures Authorization header with Bearer token is present
 */
@Injectable()
export class OAuthTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header. Expected: Bearer <token>');
    }

    // Extract and store token in request for use by controller/service
    const token = authHeader.substring(7);
    request.oauthToken = token;

    return true;
  }
}
