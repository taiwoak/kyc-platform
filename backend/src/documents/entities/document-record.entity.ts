import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('identity_documents')
export class DocumentRecordEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'document_id' })
  documentId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'document_type' })
  documentType!: string;

  @Column({ name: 'document_number', nullable: true })
  documentNumber?: string;

  @Column({ name: 'object_key' })
  objectKey!: string;

  @Column({ name: 'selfie_object_key', nullable: true })
  selfieObjectKey?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'extracted_text' })
  extractedText?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
