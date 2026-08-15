import { VerificationStatus } from '../types/kyc';

const labels: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  MANUAL_REVIEW_REQUIRED: 'Manual Review',
  FAILED: 'Failed',
};

export function StatusPill({ status }: { status: VerificationStatus }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
