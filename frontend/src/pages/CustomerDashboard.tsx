import { CheckCircle2, Clock, FileSearch, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { ScoreGauge } from '../components/ScoreGauge';
import { StatTile } from '../components/StatTile';
import { StatusPill } from '../components/StatusPill';
import { useVerificationHistory } from '../hooks/useVerification';

export function CustomerDashboard() {
  const { records, loading } = useVerificationHistory();
  const navigate = useNavigate();
  const latest = records[0];
  const verified = records.filter((record) => record.verificationStatus === 'VERIFIED').length;
  const manual = records.filter((record) => record.verificationStatus === 'MANUAL_REVIEW_REQUIRED').length;
  const rejected = records.filter((record) => record.verificationStatus === 'REJECTED').length;

  return (
    <section className="workspace">
      <div className="section-heading">
        <h1>Dashboard</h1>
        <Link className="primary-button" to="/verify">Start verification</Link>
      </div>
      <div className="stats-grid">
        <StatTile icon={CheckCircle2} label="Verified" value={verified} />
        <StatTile icon={Clock} label="Manual review" value={manual} />
        <StatTile icon={ShieldAlert} label="Rejected" value={rejected} />
        <StatTile icon={FileSearch} label="Total checks" value={records.length} />
      </div>
      {latest?.result && (
        <section className="result-band">
          <div>
            <span>Latest result</span>
            <h2>{latest.result.verification_id}</h2>
            <StatusPill status={latest.verificationStatus} />
          </div>
          <ScoreGauge value={latest.result.confidence_score} label="Confidence" />
        </section>
      )}
      <div className="table-surface">
        <div className="table-header">
          <h2>Verification history</h2>
          {loading && <span>Loading</span>}
        </div>
        <table>
          <thead>
            <tr><th>Request</th><th>Status</th><th>Confidence</th><th>Submitted</th></tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.verificationId}
                onClick={() => navigate(`/review/${record.verificationId}`)}
                style={{ cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ color: 'var(--primary)' }}>{record.verificationId.slice(0, 8)}</td>
                <td><StatusPill status={record.verificationStatus} /></td>
                <td>{record.result ? `${Math.round(record.result.confidence_score)}%` : '-'}</td>
                <td>{new Date(record.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!records.length && <tr><td colSpan={4}>No verification records</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
