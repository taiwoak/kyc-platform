export type UserRole = 'CUSTOMER' | 'VERIFICATION_OFFICER' | 'COMPLIANCE_OFFICER' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'MANUAL_REVIEW_REQUIRED' | 'FAILED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ExtractedFields {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  document_number?: string;
  expiry_date?: string;
  address?: string;
}

export interface AiResult {
  verification_id: string;
  customer_id: string;
  status: VerificationStatus;
  confidence_score: number;
  ocr_status: string;
  document_authenticity: string;
  face_similarity: number;
  liveness_status: string;
  extracted_fields: ExtractedFields;
  detected_anomalies: string[];
  module_scores: Record<string, number>;
  timestamp: string;
}

export interface VerificationRecord {
  verificationId: string;
  userId: string;
  documentId: string;
  documentObjectKey: string;
  selfieObjectKey: string;
  verificationStatus: VerificationStatus;
  result?: AiResult;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  subject: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
