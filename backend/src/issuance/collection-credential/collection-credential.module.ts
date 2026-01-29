import { Module } from '@nestjs/common';
import { CollectionCredentialController } from './collection-credential.controller';
import { CollectionCredentialService } from './services/collection-credential.service';
import { CollectionIdGeneratorService } from './services/collection-id-generator.service';
import { CollectionCredentialRepository } from './repositories/collection-credential.repository';
import { IssuanceModule } from '../issuance.module';
import { OrganisationsModule } from '../../nzbn/organisations/organisations.module';

@Module({
  imports: [IssuanceModule, OrganisationsModule],
  controllers: [CollectionCredentialController],
  providers: [
    CollectionCredentialService,
    CollectionIdGeneratorService,
    CollectionCredentialRepository,
  ],
  exports: [CollectionCredentialService, CollectionCredentialRepository],
})
export class CollectionCredentialModule {}
