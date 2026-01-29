import { Module } from '@nestjs/common';
import { DeliveryCredentialController } from './delivery-credential.controller';
import { DeliveryCredentialService } from './services/delivery-credential.service';
import { DeliveryIdGeneratorService } from './services/delivery-id-generator.service';
import { DeliveryCredentialRepository } from './repositories/delivery-credential.repository';
import { IssuanceModule } from '../issuance.module';
import { OrganisationsModule } from '../../nzbn/organisations/organisations.module';

@Module({
  imports: [IssuanceModule, OrganisationsModule],
  controllers: [DeliveryCredentialController],
  providers: [
    DeliveryCredentialService,
    DeliveryIdGeneratorService,
    DeliveryCredentialRepository,
  ],
  exports: [DeliveryCredentialService, DeliveryCredentialRepository],
})
export class DeliveryCredentialModule {}
