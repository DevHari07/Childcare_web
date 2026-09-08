'use client';

/**
 * Local-account auth client (APP_AUTH_MODE=local on the backend).
 *
 * Talks to /auth/register and /auth/login on the auth backend, then stores the
 * JWT + profile in the same legacy `token` / `user` localStorage keys the rest
 * of the app already reads (Header, dashboards, ApplyWizard, applicationsApi).
 */
import { AUTH_CHANGE_EVENT, notifyAuthChange } from '@/lib/authEvents';

const AUTH_API_URL = (process.env.NEXT_PUBLIC_AUTH_API_URL as string) || 'http://localhost:8000';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export interface LocalUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; // 'parent' | 'provider'
  phone?: string;
  securityQuestions?: { question: string; answer: string }[];
}

interface AuthResponse {
  token: string;
  user: LocalUser;
}

function persist(res: AuthResponse): LocalUser {
  try {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  } catch {
    /* private mode / storage disabled — the session just won't survive a reload */
  }
  notifyAuthChange();
  return res.user;
}

async function post(path: string, body: unknown): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the account service. Please try again later.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let detail = 'Something went wrong. Please try again.';
    const d = data?.detail;
    if (typeof d === 'string') {
      detail = d;
    } else if (Array.isArray(d) && d[0]?.msg) {
      detail = String(d[0].msg).replace(/^Value error,\s*/i, '');
    }
    throw new Error(detail);
  }
  return data as AuthResponse;
}

export async function register(input: RegisterInput): Promise<LocalUser> {
  return persist(
    await post('/auth/register', {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      password: input.password,
      role: input.role,
      phone: input.phone?.trim() || undefined,
      securityQuestions: input.securityQuestions ?? [],
    }),
  );
}

export async function login(email: string, password: string): Promise<LocalUser> {
  return persist(await post('/auth/login', { email: email.trim(), password }));
}

export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  notifyAuthChange();
}

export function getToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    if (isExpired(token)) {
      logout();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function currentUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || !localStorage.getItem(TOKEN_KEY)) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return false; // can't parse — let the server reject it
  }
}

export { AUTH_CHANGE_EVENT };
