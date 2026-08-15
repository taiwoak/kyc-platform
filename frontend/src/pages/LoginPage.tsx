import { FormEvent, useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('customer@kyc.local');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-mark"><ShieldCheck size={32} />KYC Platform</div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
          {error && <p className="error-banner">{error}</p>}
          <button className="primary-button" disabled={submitting} type="submit"><LogIn size={18} />Sign in</button>
        </form>
        <Link to="/register">Create account</Link>
      </section>
    </main>
  );
}
