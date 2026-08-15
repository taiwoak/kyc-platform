import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentRecordEntity } from './entities/document-record.entity';
import { DocumentsService } from './documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentRecordEntity])],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
