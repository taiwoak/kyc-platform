import { useEffect, useState } from 'react';

import { ScoreGauge } from '../components/ScoreGauge';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { VerificationRecord } from '../types/kyc';

export function OfficerDashboard() {
  const { token } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([]);

  const loadQueue = () => {
    if (token) {
      void api.getReviewQueue(token).then(setRecords);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [token]);

  const handleAction = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!token) return;
    try {
      await api.updateVerificationStatus(id, status, token);
      loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

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
            <div className="review-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <ScoreGauge value={record.result?.confidence_score ?? 0} label="Confidence" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="primary-button" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleAction(record.verificationId, 'VERIFIED')}>Approve</button>
                <button className="secondary-button" style={{ padding: '0.25rem 0.5rem', color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleAction(record.verificationId, 'REJECTED')}>Reject</button>
              </div>
            </div>
          </article>
        ))}
        {!records.length && <p className="empty-state">No manual review records</p>}
      </div>
    </section>
  );
}
