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

  useEffect(() => {
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
  }, [token]);

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
                <tr key={user.id}><td>{user.fullName}</td><td>{user.role}</td><td>{user.status}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="table-surface">
          <h2>Recent verifications</h2>
          <table>
            <thead><tr><th>Request</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {records.slice(0, 8).map((record) => (
                <tr key={record.verificationId}>
                  <td>{record.verificationId.slice(0, 8)}</td>
                  <td><StatusPill status={record.verificationStatus} /></td>
                  <td>{record.result ? Math.round(record.result.confidence_score) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
