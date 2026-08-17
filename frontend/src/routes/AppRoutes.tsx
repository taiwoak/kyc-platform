import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../layouts/AppShell';
import { AdminDashboard } from '../pages/AdminDashboard';
import { CustomerDashboard } from '../pages/CustomerDashboard';
import { LoginPage } from '../pages/LoginPage';
import { OfficerDashboard } from '../pages/OfficerDashboard';
import { RegisterPage } from '../pages/RegisterPage';
import { VerificationResultPage } from '../pages/VerificationResultPage';
import { VerifyIdentityPage } from '../pages/VerifyIdentityPage';
import { UserRole } from '../types/kyc';

function RequireAuth({ children, roles }: { children: React.ReactElement; roles?: UserRole[] }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="verify" element={<VerifyIdentityPage />} />
        <Route path="result" element={<VerificationResultPage />} />
        <Route
          path="reviews"
          element={<RequireAuth roles={['VERIFICATION_OFFICER', 'ADMIN']}><OfficerDashboard /></RequireAuth>}
        />
        <Route path="admin" element={<RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth>} />
      </Route>
    </Routes>
  );
}
