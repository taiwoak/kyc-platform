import { BadRequestException, Injectable } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { DocumentsService } from '../documents/documents.service';
import { StorageService } from '../storage/storage.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { AiEngineClient } from './ai-engine.client';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  constructor(
    private readonly storageService: StorageService,
    private readonly documentsService: DocumentsService,
    private readonly verificationRepository: VerificationRepository,
    private readonly aiEngineClient: AiEngineClient,
    private readonly auditService: AuditService,
  ) {}

  async submit(input: {
    userId: string;
    dto: CreateVerificationDto;
    document?: Express.Multer.File;
    selfie?: Express.Multer.File;
  }) {
    if (!input.document || !input.selfie) {
      throw new BadRequestException('Both document and selfie files are required');
    }

    const documentObject = await this.storageService.upload('documents', input.document);
    const selfieObject = await this.storageService.upload('selfies', input.selfie);

    const documentRecord = await this.documentsService.create({
      userId: input.userId,
      documentType: input.dto.documentType,
      documentNumber: input.dto.documentNumber,
      objectKey: documentObject.objectKey,
      selfieObjectKey: selfieObject.objectKey,
    });

    const verification = await this.verificationRepository.create({
      userId: input.userId,
      documentId: documentRecord.documentId,
      documentObjectKey: documentObject.objectKey,
      selfieObjectKey: selfieObject.objectKey,
      verificationStatus: VerificationStatus.Processing,
    });

    this.auditService.record({
      actorId: input.userId,
      action: 'VERIFICATION_SUBMITTED',
      subject: verification.verificationId,
      metadata: { documentType: input.dto.documentType },
    });

    try {
      const result = await this.aiEngineClient.verify({
        customerId: input.userId,
        documentType: input.dto.documentType,
        document: input.document,
        selfie: input.selfie,
      });
      await this.documentsService.updateExtractedText(documentRecord.documentId, result.extracted_fields as Record<string, unknown>);
      const completed = await this.verificationRepository.complete(verification.verificationId, result.status as VerificationStatus, result);
      this.auditService.record({
        actorId: input.userId,
        action: 'VERIFICATION_COMPLETED',
        subject: verification.verificationId,
        metadata: { status: result.status, confidenceScore: result.confidence_score },
      });
      return completed;
    } catch (error) {
      const failed = await this.verificationRepository.fail(verification.verificationId);
      this.auditService.record({
        actorId: input.userId,
        action: 'VERIFICATION_FAILED',
        subject: verification.verificationId,
        metadata: { reason: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  historyForUser(userId: string) {
    return this.verificationRepository.listByUser(userId);
  }

  manualReviewQueue() {
    return this.verificationRepository.listManualReview();
  }

  all() {
    return this.verificationRepository.listAll();
  }
}
