import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VerificationStatus } from '../common/enums/verification-status.enum';
import { AiVerificationResponse } from './interfaces/ai-verification-response.interface';
import { VerificationRequestEntity } from './entities/verification-request.entity';

@Injectable()
export class VerificationRepository {
  constructor(
    @InjectRepository(VerificationRequestEntity)
    private readonly repo: Repository<VerificationRequestEntity>,
  ) {}

  async create(input: Omit<VerificationRequestEntity, 'verificationId' | 'createdAt' | 'updatedAt' | 'result'>): Promise<VerificationRequestEntity> {
    const record = this.repo.create(input);
    return this.repo.save(record);
  }

  async complete(verificationId: string, status: VerificationStatus, result: AiVerificationResponse): Promise<VerificationRequestEntity> {
    await this.repo.update(verificationId, { verificationStatus: status, result: result as any });
    const record = await this.repo.findOne({ where: { verificationId } });
    if (!record) throw new Error('Verification request not found');
    return record;
  }

  async updateStatus(verificationId: string, status: VerificationStatus): Promise<VerificationRequestEntity> {
    await this.repo.update(verificationId, { verificationStatus: status });
    const record = await this.repo.findOne({ where: { verificationId } });
    if (!record) throw new Error('Verification request not found');
    return record;
  }

  async fail(verificationId: string): Promise<VerificationRequestEntity> {
    await this.repo.update(verificationId, { verificationStatus: VerificationStatus.Failed });
    const record = await this.repo.findOne({ where: { verificationId } });
    if (!record) throw new Error('Verification request not found');
    return record;
  }

  listByUser(userId: string): Promise<VerificationRequestEntity[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findById(verificationId: string): Promise<VerificationRequestEntity> {
    const record = await this.repo.findOne({ where: { verificationId } });
    if (!record) throw new Error('Verification request not found');
    return record;
  }

  listManualReview(): Promise<VerificationRequestEntity[]> {
    return this.repo.find({
      where: { verificationStatus: VerificationStatus.ManualReviewRequired },
      order: { createdAt: 'DESC' },
    });
  }

  listAll(): Promise<VerificationRequestEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
