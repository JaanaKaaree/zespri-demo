import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NzbnOAuthService } from './services/nzbn-oauth.service';
import { OAuthStateService } from './services/oauth-state.service';
import { SessionService } from '../../session/session.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Controller('nzbn/oauth')
export class NzbnOAuthController {
  private readonly logger = new Logger(NzbnOAuthController.name);

  constructor(
    private readonly oauthService: NzbnOAuthService,
    private readonly stateService: OAuthStateService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  @Get('authorize-url')
  @UseGuards(JwtAuthGuard)
  async getAuthorizationUrl(@Request() req) {
    try {
      this.logger.log(`Get authorization URL request received`);
      
      const sessionId = req.user?.sessionId || req.user?.sub;
      this.logger.log(`Extracted sessionId: ${sessionId}`);
      
      if (!sessionId) {
        this.logger.error('Session not found in request');
        throw new UnauthorizedException('Session not found');
      }

      // Generate state parameter
      const state = uuidv4();
      this.logger.log(`Generated state: ${state} for sessionId: ${sessionId}`);

      // Store state -> sessionId mapping
      await this.stateService.setState(state, sessionId);
      this.logger.log(`State stored successfully`);

      // Generate authorization URL
      const authorizationUrl = this.oauthService.getAuthorizationUrl(state);

      this.logger.log(`Generated authorization URL for user ${req.user?.email || 'unknown'}`);
      this.logger.log(`Authorization URL: ${authorizationUrl}`);

      return { authorizationUrl };
    } catch (error) {
      this.logger.error(`Error getting authorization URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('authorize')
  @UseGuards(JwtAuthGuard)
  async authorize(@Request() req, @Res() res: Response) {
    try {
      this.logger.log(`Authorize request received (redirect endpoint)`);
      
      const sessionId = req.user?.sessionId || req.user?.sub;
      this.logger.log(`Extracted sessionId: ${sessionId}`);
      
      if (!sessionId) {
        this.logger.error('Session not found in request');
        return res.status(401).json({ error: 'Session not found' });
      }

      // Generate state parameter
      const state = uuidv4();

      // Store state -> sessionId mapping
      await this.stateService.setState(state, sessionId);

      // Generate authorization URL
      const authorizationUrl = this.oauthService.getAuthorizationUrl(state);

      this.logger.log(`Redirecting user ${req.user?.email || 'unknown'} to NZBN authorization`);

      // Redirect to NZBN authorization page
      return res.redirect(authorizationUrl);
    } catch (error) {
      this.logger.error(`Error in authorize: ${error.message}`, error.stack);
      return res.status(500).json({ error: 'Failed to initiate OAuth flow', message: error.message });
    }
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    try {
      // Handle error from OAuth provider
      if (error) {
        this.logger.error(`OAuth error: ${error} - ${errorDescription}`);
        const frontendUrl = this.configService.get<string>(
          'frontend.url',
          'http://localhost:3000',
        );
        return res.redirect(
          `${frontendUrl}/nzbn/oauth/callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
        );
      }

      if (!code || !state) {
        this.logger.error('Missing code or state in callback');
        const frontendUrl = this.configService.get<string>(
          'frontend.url',
          'http://localhost:3000',
        );
        return res.redirect(
          `${frontendUrl}/nzbn/oauth/callback?error=missing_parameters`,
        );
      }

      // Get sessionId from state
      this.logger.log(`Callback received with state: ${state}`);
      this.logger.log(`Callback received with code: ${code ? 'PRESENT' : 'MISSING'}`);
      const sessionId = await this.stateService.getSessionId(state);
      this.logger.log(`Retrieved sessionId from state: ${sessionId || 'NOT FOUND'}`);
      if (!sessionId) {
        this.logger.error(`Invalid or expired state parameter. State received: ${state}`);
        const frontendUrl = this.configService.get<string>(
          'frontend.url',
          'http://localhost:3000',
        );
        return res.redirect(
          `${frontendUrl}/nzbn/oauth/callback?error=invalid_state`,
        );
      }

      // Exchange code for token
      const tokenResponse = await this.oauthService.exchangeCodeForToken(code);

      // Get existing session
      const session = await this.sessionService.get(sessionId);
      if (!session) {
        this.logger.error(`Session not found: ${sessionId}`);
        const frontendUrl = this.configService.get<string>(
          'frontend.url',
          'http://localhost:3000',
        );
        return res.redirect(
          `${frontendUrl}/nzbn/oauth/callback?error=session_not_found`,
        );
      }

      // Calculate expiration time
      const expiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined;

      // Store token in session data
      const updatedSession = {
        ...session,
        data: {
          ...session.data,
          nzbnOAuthToken: {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: expiresAt,
            token_type: tokenResponse.token_type || 'Bearer',
          },
        },
      };

      await this.sessionService.set(sessionId, updatedSession);

      this.logger.log(`OAuth token stored for session: ${sessionId}`);

      // Redirect to frontend callback page
      const frontendUrl = this.configService.get<string>(
        'frontend.url',
        'http://localhost:3000',
      );
      return res.redirect(`${frontendUrl}/nzbn/oauth/callback?success=true`);
    } catch (error) {
      this.logger.error(`Error in callback: ${error.message}`, error.stack);
      const frontendUrl = this.configService.get<string>(
        'frontend.url',
        'http://localhost:3000',
      );
      return res.redirect(
        `${frontendUrl}/nzbn/oauth/callback?error=token_exchange_failed`,
      );
    }
  }
}
