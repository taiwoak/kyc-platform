import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DocumentRecordEntity } from './entities/document-record.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentRecordEntity)
    private readonly repo: Repository<DocumentRecordEntity>,
  ) {}

  async create(input: {
    userId: string;
    documentType: string;
    documentNumber?: string;
    objectKey: string;
    selfieObjectKey?: string;
  }): Promise<DocumentRecordEntity> {
    const record = this.repo.create(input);
    return this.repo.save(record);
  }

  async updateExtractedText(documentId: string, extractedText: Record<string, unknown>): Promise<DocumentRecordEntity | null> {
    await this.repo.update(documentId, { extractedText });
    return this.repo.findOne({ where: { documentId } });
  }
}
