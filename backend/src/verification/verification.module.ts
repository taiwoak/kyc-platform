import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { DocumentsModule } from '../documents/documents.module';
import { StorageModule } from '../storage/storage.module';
import { VerificationRequestEntity } from './entities/verification-request.entity';
import { AiEngineClient } from './ai-engine.client';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from './verification.repository';
import { VerificationService } from './verification.service';
import { NinMockService } from './nin-mock.service';

@Module({
  imports: [
    HttpModule,
    StorageModule,
    DocumentsModule,
    AuditModule,
    TypeOrmModule.forFeature([VerificationRequestEntity]),
  ],
  controllers: [VerificationController],
  providers: [AiEngineClient, VerificationRepository, VerificationService, NinMockService],
})
export class VerificationModule {}
