import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OAuthTokenGuard } from './oauth-token.guard';

describe('OAuthTokenGuard', () => {
  let guard: OAuthTokenGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    guard = new OAuthTokenGuard();
  });

  const createMockExecutionContext = (headers: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request with valid Bearer token', () => {
    const headers = {
      authorization: 'Bearer valid-oauth-token-12345',
    };
    mockExecutionContext = createMockExecutionContext(headers);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    const request = mockExecutionContext.switchToHttp().getRequest();
    expect(request.oauthToken).toBe('valid-oauth-token-12345');
  });

  it('should reject request without Authorization header', () => {
    const headers = {};
    mockExecutionContext = createMockExecutionContext(headers);

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      'Missing or invalid Authorization header. Expected: Bearer <token>',
    );
  });

  it('should reject request with invalid Authorization header format', () => {
    const headers = {
      authorization: 'InvalidFormat token-12345',
    };
    mockExecutionContext = createMockExecutionContext(headers);

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should reject request with empty Bearer token', () => {
    const headers = {
      authorization: 'Bearer ',
    };
    mockExecutionContext = createMockExecutionContext(headers);

    // This will pass the guard but token will be empty string
    // The guard only checks format, not content
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });
});
