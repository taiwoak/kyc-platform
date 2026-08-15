import { useEffect, useState } from 'react';

import { ScoreGauge } from '../components/ScoreGauge';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { VerificationRecord } from '../types/kyc';

export function OfficerDashboard() {
  const { token } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([]);

  useEffect(() => {
    if (token) {
      void api.getReviewQueue(token).then(setRecords);
    }
  }, [token]);

  return (
    <section className="workspace">
      <div className="section-heading">
        <h1>Manual Reviews</h1>
        <span className="quiet-label">{records.length} pending</span>
      </div>
      <div className="review-list">
        {records.map((record) => (
          <article className="review-item" key={record.verificationId}>
            <div>
              <strong>{record.verificationId}</strong>
              <StatusPill status={record.verificationStatus} />
              <p>{record.result?.detected_anomalies.join(', ') || 'No anomaly summary'}</p>
            </div>
            <ScoreGauge value={record.result?.confidence_score ?? 0} label="Confidence" />
          </article>
        ))}
        {!records.length && <p className="empty-state">No manual review records</p>}
      </div>
    </section>
  );
}
