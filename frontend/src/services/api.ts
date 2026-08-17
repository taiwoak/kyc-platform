/// <reference types="vite/client" />
import { AuditEvent, AuthResponse, User, VerificationRecord } from '../types/kyc';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(fullName: string, email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  },
  submitVerification(formData: FormData, token: string) {
    return request<VerificationRecord>('/verification/requests', {
      method: 'POST',
      body: formData,
    }, token);
  },
  getHistory(token: string) {
    return request<VerificationRecord[]>('/verification/history', {}, token);
  },
  getReviewQueue(token: string) {
    return request<VerificationRecord[]>('/verification/reviews', {}, token);
  },
  getAllVerifications(token: string) {
    return request<VerificationRecord[]>('/verification/all', {}, token);
  },
  getUsers(token: string) {
    return request<User[]>('/users', {}, token);
  },
  getAuditEvents(token: string) {
    return request<AuditEvent[]>('/audit', {}, token);
  },
  updateVerificationStatus(id: string, status: string, token: string) {
    return request<VerificationRecord>(`/verification/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },
  submitNinVerification(data: FormData, token: string) {
    return request<VerificationRecord>('/verification/nin-verify', {
      method: 'POST',
      body: data,
    }, token);
  },
  updateUserRole(id: string, role: string, token: string) {
    return request<User>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }, token);
  },
};
