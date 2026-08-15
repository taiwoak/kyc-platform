import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditEventEntity } from '../audit/entities/audit-event.entity';
import { DocumentRecordEntity } from '../documents/entities/document-record.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VerificationRequestEntity } from '../verification/entities/verification-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('postgresHost'),
        port: config.get<number>('postgresPort'),
        database: config.get<string>('postgresDb'),
        username: config.get<string>('postgresUser'),
        password: config.get<string>('postgresPassword'),
        entities: [
          UserEntity,
          VerificationRequestEntity,
          DocumentRecordEntity,
          AuditEventEntity,
        ],
        synchronize: true,   // auto-creates tables in dev/demo mode
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
