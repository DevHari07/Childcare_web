'use client';

/**
 * Client for the child support applications API (backend-auth service).
 *
 * The entire wizard state is sent as one JSON blob in `applicationDetails`; the
 * backend stores it verbatim in `applications.application_details` (jsonb).
 *
 * Every call carries the Cognito ID token as a bearer token. In the backend's
 * `dev` auth mode the signature isn't verified, but the real user is still
 * recorded from the token's claims.
 */
import { getAuthToken } from '@/lib/authToken';

const API_URL = (process.env.NEXT_PUBLIC_AUTH_API_URL as string) || 'http://localhost:8000';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationSummary {
  id: number;
  reference_code: string;
  application_status: ApplicationStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  application_name: string | null;
  applicant_type: string | null;
  service_type: string | null;
  applicant_name: string | null;
  child_count: number | null;
}

export interface ApplicationRecord extends ApplicationSummary {
  applicant_user_id: number | null;
  application_details: Record<string, unknown>;
}

export interface ConsentItemInput {
  consentItemCode: string;
  accepted: boolean;
  bodySnapshot: string;
}

export class ApplicationsApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApplicationsApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApplicationsApiError(0, 'Could not reach the application service.');
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      (body && (body.detail || body.message)) || `Request failed (${res.status})`;
    throw new ApplicationsApiError(res.status, typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return body as T;
}

export function listApplications(): Promise<ApplicationSummary[]> {
  return request('/applications');
}

export function getApplication(id: number): Promise<ApplicationRecord> {
  return request(`/applications/${id}`);
}

export function createApplication(applicationDetails: Record<string, unknown>): Promise<ApplicationRecord> {
  return request('/applications', {
    method: 'POST',
    body: JSON.stringify({ applicationDetails }),
  });
}

export function saveApplication(
  id: number,
  applicationDetails: Record<string, unknown>,
): Promise<ApplicationRecord> {
  return request(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ applicationDetails }),
  });
}

export function submitApplication(
  id: number,
  payload: { signature: string; certified: boolean; agreements: ConsentItemInput[]; applicationDetails?: Record<string, unknown> },
): Promise<ApplicationRecord> {
  return request(`/applications/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function withdrawApplication(id: number): Promise<ApplicationRecord> {
  return request(`/applications/${id}`, { method: 'DELETE' });
}

export interface WorkerPushResult {
  payload: Record<string, unknown>;
  outcome: {
    dryRun: boolean;
    rolledBack: boolean;
    result?: { aplctn?: { id?: number; aplctn_num?: string }; persons?: unknown[] };
    planCount: number;
  };
}

/**
 * Hand a submitted application to the CCMS worker, which builds the csa_portal
 * payload and writes it into the CCMS database. Only call this after the
 * application reached SUBMITTED (i.e. the applicant clicked "I AGREE").
 */
export function pushApplicationToWorker(id: number): Promise<WorkerPushResult> {
  return request(`/worker/applications/${id}/push?dryRun=false`, { method: 'POST' });
}
