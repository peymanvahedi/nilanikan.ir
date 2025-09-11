import { request } from './api';

export type User = {
  id: number;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
};

export async function me(): Promise<User | null> {
  // endpoint : /api/auth/me/
  return await request<User>('/auth/me/', {
    auth: true,
    throwOnHTTP: false,
    fallback: null,
  });
}

export async function login(payload: { email?: string; phone?: string; password: string }) {
  return await request<{ access: string; refresh: string }>('/auth/login/', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function register(payload: { email?: string; phone?: string; password: string; name?: string }) {
  return await request('/auth/register/', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

// ---- auto-added: logout (uses request) ----
export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (e) {
    // swallow to avoid blocking UI
  }
}
