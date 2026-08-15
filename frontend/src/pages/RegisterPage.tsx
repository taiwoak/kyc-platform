import { FormEvent, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { register, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await register(fullName, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-mark">KYC Platform</div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
          {error && <p className="error-banner">{error}</p>}
          <button className="primary-button" type="submit"><UserPlus size={18} />Create account</button>
        </form>
        <Link to="/login">Sign in</Link>
      </section>
    </main>
  );
}
