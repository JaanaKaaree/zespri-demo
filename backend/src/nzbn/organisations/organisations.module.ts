import { Module } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { OrganisationsController } from './organisations.controller';
import { NzbnOAuthService } from './services/nzbn-oauth.service';
import { OAuthStateService } from './services/oauth-state.service';
import { NzbnOAuthController } from './oauth.controller';
import { SessionModule } from '../../session/session.module';

@Module({
  imports: [SessionModule],
  providers: [OrganisationsService, NzbnOAuthService, OAuthStateService],
  controllers: [OrganisationsController, NzbnOAuthController],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
