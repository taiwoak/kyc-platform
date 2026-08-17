import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Users } from 'lucide-react';

import { StatTile } from '../components/StatTile';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { AuditEvent, User, VerificationRecord } from '../types/kyc';

export function AdminDashboard() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = () => {
    if (!token) {
      return;
    }
    void Promise.all([
      api.getUsers(token),
      api.getAllVerifications(token),
      api.getAuditEvents(token),
    ]).then(([nextUsers, nextRecords, nextEvents]) => {
      setUsers(nextUsers);
      setRecords(nextRecords);
      setEvents(nextEvents);
    });
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!token) return;
    try {
      await api.updateUserRole(userId, newRole, token);
      loadData(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;
  const currentRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section className="workspace">
      <div className="section-heading">
        <h1>Administration</h1>
      </div>
      <div className="stats-grid">
        <StatTile icon={Users} label="Users" value={users.length} />
        <StatTile icon={ShieldCheck} label="Verifications" value={records.length} />
        <StatTile icon={Activity} label="Audit events" value={events.length} />
      </div>
      <div className="split-grid">
        <section className="table-surface">
          <h2>Users</h2>
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="VERIFICATION_OFFICER">Verification Officer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="table-surface">
          <h2>Recent verifications</h2>
          <table>
            <thead><tr><th>Request</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {currentRecords.map((record) => (
                <tr key={record.verificationId}>
                  <td>{record.verificationId.slice(0, 8)}</td>
                  <td><StatusPill status={record.verificationStatus} /></td>
                  <td>{record.result ? Math.round(record.result.confidence_score) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                className="secondary-button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {currentPage} of {totalPages}</span>
              <button
                className="secondary-button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
