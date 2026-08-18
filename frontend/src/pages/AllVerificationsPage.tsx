import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { VerificationRecord } from '../types/kyc';

export function AllVerificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!token) return;
    void api.getAllVerifications(token).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [token]);

  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;
  const currentRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section className="workspace">
      <div className="section-heading">
        <h1>All Verifications</h1>
        <span className="quiet-label">{records.length} total</span>
      </div>
      <div className="table-surface">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5}>Loading...</td></tr>
            )}
            {!loading && currentRecords.map((record) => (
              <tr
                key={record.verificationId}
                onClick={() => navigate(`/review/${record.verificationId}`)}
                style={{ cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{record.verificationId.slice(0, 8)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{record.userId.slice(0, 8)}</td>
                <td><StatusPill status={record.verificationStatus} /></td>
                <td>{record.result ? `${Math.round(record.result.confidence_score)}%` : '-'}</td>
                <td>{new Date(record.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && !records.length && (
              <tr><td colSpan={5} className="empty-state">No verification records found</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              className="secondary-button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {currentPage} of {totalPages}</span>
            <button
              className="secondary-button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
