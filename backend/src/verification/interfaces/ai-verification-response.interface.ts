import { VerificationStatus } from '../../common/enums/verification-status.enum';

export interface AiVerificationResponse {
  verification_id: string;
  customer_id: string;
  status: VerificationStatus;
  confidence_score: number;
  ocr_status: string;
  document_authenticity: string;
  face_similarity: number;
  liveness_status: string;
  extracted_fields: Record<string, unknown>;
  detected_anomalies: string[];
  module_scores: Record<string, number>;
  timestamp: string;
}
