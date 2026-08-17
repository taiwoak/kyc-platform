import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { DocumentsService } from '../documents/documents.service';
import { StorageService } from '../storage/storage.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { AiEngineClient } from './ai-engine.client';
import { NinMockService } from './nin-mock.service';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly documentsService: DocumentsService,
    private readonly verificationRepository: VerificationRepository,
    private readonly aiEngineClient: AiEngineClient,
    private readonly auditService: AuditService,
    private readonly ninMockService: NinMockService,
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
        declaredDocumentNumber: input.dto.documentNumber,
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
      this.logger.log(`Verification completed for user ${input.userId} with status ${result.status}`);
      this.logger.log(completed);
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

  async updateStatus(verificationId: string, status: VerificationStatus, actorId: string) {
    const updated = await this.verificationRepository.updateStatus(verificationId, status);
    this.auditService.record({
      actorId,
      action: 'VERIFICATION_STATUS_UPDATED',
      subject: verificationId,
      metadata: { newStatus: status },
    });
    return this.verificationRepository.findById(verificationId);
  }

  async submitNinVerification(input: {
    userId: string;
    nin: string;
    selfie: Express.Multer.File;
  }) {
    // 1. Mock NIN vendor lookup
    const { profile, photoBuffer } = this.ninMockService.lookup(input.nin);

    // 2. Upload the extracted photo to MinIO for record keeping
    const documentObj = await this.storageService.upload(
      `documents/${input.userId}`,
      {
        buffer: photoBuffer,
        originalname: 'nin-photo.jpg',
        mimetype: 'image/jpeg',
        size: photoBuffer.length,
      } as Express.Multer.File,
    );

    const selfieObj = await this.storageService.upload(`selfies/${input.userId}`, input.selfie);

    // 3. Call AI Engine for biometrics
    const aiResponse = await this.aiEngineClient.verifyFromBytes({
      customerId: input.userId,
      photoBuffer,
      selfieFile: input.selfie,
    });

    // 4. Merge NIN profile data into extracted fields
    aiResponse.extracted_fields = {
      ...aiResponse.extracted_fields,
      full_name: `${profile.firstName} ${profile.middleName} ${profile.surname}`.replace(/\s+/g, ' ').trim(),
      date_of_birth: profile.dateOfBirth,
      gender: profile.gender,
      document_number: profile.nin,
    };

    // 5. Store record
    const verification = await this.verificationRepository.create({
      userId: input.userId,
      documentId: null as any, // No document record for NIN biometric
      documentObjectKey: documentObj.objectKey,
      selfieObjectKey: selfieObj.objectKey,
      verificationStatus: VerificationStatus.Processing,
    });

    const completed = await this.verificationRepository.complete(
      verification.verificationId,
      aiResponse.status === 'VERIFIED'
        ? VerificationStatus.Verified
        : aiResponse.status === 'REJECTED'
          ? VerificationStatus.Rejected
          : VerificationStatus.ManualReviewRequired,
      aiResponse
    );

    this.auditService.record({
      actorId: input.userId,
      action: 'NIN_BIOMETRIC_SUBMITTED',
      subject: verification.verificationId,
      metadata: { status: aiResponse.status, nin: input.nin },
    });
    return completed;
  }

  async historyForUser(userId: string) {
    return this.verificationRepository.listByUser(userId);
  }

  manualReviewQueue() {
    return this.verificationRepository.listManualReview();
  }

  all() {
    return this.verificationRepository.listAll();
  }
}
