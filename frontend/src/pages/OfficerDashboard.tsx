import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ScoreGauge } from '../components/ScoreGauge';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { VerificationRecord } from '../types/kyc';

export function OfficerDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
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
          <article 
            className="review-item" 
            key={record.verificationId} 
            onClick={() => navigate(`/review/${record.verificationId}`)}
            style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', border: '1px solid var(--border)' }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div>
              <strong>{record.verificationId}</strong>
              <StatusPill status={record.verificationStatus} />
              <p>{record.result?.detected_anomalies.join(', ') || 'No anomaly summary'}</p>
            </div>
            <div className="review-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <ScoreGauge value={record.result?.confidence_score ?? 0} label="Confidence" />
              <button className="primary-button" style={{ padding: '0.25rem 0.5rem' }}>Review Details</button>
            </div>
          </article>
        ))}
        {!records.length && <p className="empty-state">No manual review records</p>}
      </div>
    </section>
  );
}
