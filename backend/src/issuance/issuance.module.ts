import { Module } from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { IssuanceController } from './issuance.controller';
import { MATTROAuthService } from './services/mattr-oauth.service';

@Module({
  providers: [IssuanceService, MATTROAuthService],
  controllers: [IssuanceController],
  exports: [IssuanceService, MATTROAuthService],
})
export class IssuanceModule {}
