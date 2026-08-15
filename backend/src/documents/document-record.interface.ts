export interface IdentityDocumentRecord {
  documentId: string;
  userId: string;
  documentType: string;
  documentNumber?: string;
  objectKey: string;
  selfieObjectKey?: string;
  extractedText?: Record<string, unknown>;
  createdAt: Date;
}
