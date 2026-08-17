import { BarChart3, ClipboardCheck, FileSearch, LogOut, ShieldCheck, UploadCloud, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function AppShell() {
  const { user, logout } = useAuth();
  const isOfficer = user?.role === 'VERIFICATION_OFFICER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck aria-hidden="true" size={26} />
          <span>KYC Platform</span>
        </div>
        <nav className="nav-list">
          <NavLink to="/dashboard"><BarChart3 size={18} />Dashboard</NavLink>
          <NavLink to="/verify"><UploadCloud size={18} />Verify</NavLink>
          {isOfficer && <NavLink to="/reviews"><FileSearch size={18} />Reviews</NavLink>}
          {isAdmin && <NavLink to="/admin"><Users size={18} />Admin</NavLink>}
        </nav>
        <button className="sidebar-action" type="button" onClick={logout}>
          <LogOut size={18} />Sign out
        </button>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <span>{user?.role.replaceAll('_', ' ')}</span>
            <strong>{user?.fullName}</strong>
          </div>
          <ClipboardCheck aria-hidden="true" size={24} />
        </header>
        <Outlet />
      </main>
    </div>
  );
}
