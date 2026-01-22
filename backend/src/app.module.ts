import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { IssuanceModule } from './issuance/issuance.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { OrganisationsModule } from './nzbn/organisations/organisations.module';
import { CollectionCredentialModule } from './issuance/collection-credential/collection-credential.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    CommonModule,
    LoggerModule,
    AuthModule,
    SessionModule,
    IssuanceModule,
    UsersModule,
    OrganisationsModule,
    CollectionCredentialModule,
  ],
})
export class AppModule {}
