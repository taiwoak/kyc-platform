import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { api } from '../services/api';
import { User } from '../types/kyc';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'kyc-platform-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; token: string | null }>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null };
  });

  const value = useMemo<AuthContextValue>(() => ({
    user: state.user,
    token: state.token,
    async login(email, password) {
      const response = await api.login(email, password);
      const nextState = { user: response.user, token: response.accessToken };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setState(nextState);
    },
    async register(fullName, email, password) {
      const response = await api.register(fullName, email, password);
      const nextState = { user: response.user, token: response.accessToken };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setState(nextState);
    },
    logout() {
      window.localStorage.removeItem(STORAGE_KEY);
      setState({ user: null, token: null });
    },
  }), [state.token, state.user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
