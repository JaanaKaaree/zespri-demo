import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract OAuth token from request headers
 */
export const OAuthToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header with Bearer token is required');
    }
    
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  },
);
