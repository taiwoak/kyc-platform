import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { AiVerificationResponse } from '../interfaces/ai-verification-response.interface';

@Entity('verification_requests')
export class VerificationRequestEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'verification_id' })
  verificationId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'document_id', nullable: true })
  documentId!: string;

  @Column({ name: 'document_object_key' })
  documentObjectKey!: string;

  @Column({ name: 'selfie_object_key' })
  selfieObjectKey!: string;

  @Column({ name: 'verification_status', type: 'varchar', default: 'PROCESSING' })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  result?: AiVerificationResponse;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
