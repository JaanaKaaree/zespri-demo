import { Module } from '@nestjs/common';
import { VerificationService } from './services/verification.service';
import { VerificationRepository } from './repositories/verification.repository';
import { VerificationController } from '../verification.controller';
import { IssuanceModule } from '../issuance.module';
import { DeliveryCredentialModule } from '../delivery-credential/delivery-credential.module';
import { CollectionCredentialModule } from '../collection-credential/collection-credential.module';

@Module({
  imports: [
    IssuanceModule,
    DeliveryCredentialModule,
    CollectionCredentialModule,
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationRepository,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
