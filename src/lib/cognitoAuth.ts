'use client';

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AUTH_CHANGE_EVENT, notifyAuthChange } from '@/lib/authEvents';

// Re-exported for existing importers (e.g. Header) — the canonical definition
// now lives in authEvents so the local-auth module can share it.
export { AUTH_CHANGE_EVENT };

const REGION = process.env.NEXT_PUBLIC_AWS_REGION as string;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID as string;
const STORAGE_KEY = 'cognito_session';

// InitiateAuth / RespondToAuthChallenge for a public app client are unauthenticated
// Cognito operations, so the browser client needs no AWS credentials.
const client = new CognitoIdentityProviderClient({ region: REGION });

interface StoredSession {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type LoginResult =
  | { step: 'DONE' }
  | { step: 'NEW_PASSWORD_REQUIRED'; session: string; email: string }
  | { step: 'MFA_CODE'; session: string; email: string; challengeName: string };

function storeTokens(idToken: string, accessToken: string, refreshToken: string, expiresInSeconds: number) {
  const stored: StoredSession = {
    idToken,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function readSession(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<LoginResult> {
  const result = await client.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
  );

  if (result.AuthenticationResult) {
    const { IdToken, AccessToken, RefreshToken, ExpiresIn } = result.AuthenticationResult;
    storeTokens(IdToken!, AccessToken!, RefreshToken!, ExpiresIn ?? 3600);
    return { step: 'DONE' };
  }

  if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return { step: 'NEW_PASSWORD_REQUIRED', session: result.Session!, email };
  }

  // EMAIL_OTP today; SMS_MFA / SOFTWARE_TOKEN_MFA would land here too if ever enabled.
  return { step: 'MFA_CODE', session: result.Session!, email, challengeName: result.ChallengeName! };
}

export async function completeNewPassword(
  email: string,
  session: string,
  newPassword: string
): Promise<LoginResult> {
  const result = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: session,
      ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
    })
  );

  if (result.AuthenticationResult) {
    const { IdToken, AccessToken, RefreshToken, ExpiresIn } = result.AuthenticationResult;
    storeTokens(IdToken!, AccessToken!, RefreshToken!, ExpiresIn ?? 3600);
    return { step: 'DONE' };
  }

  return { step: 'MFA_CODE', session: result.Session!, email, challengeName: result.ChallengeName! };
}

export async function submitMfaCode(
  email: string,
  session: string,
  challengeName: string,
  code: string
): Promise<LoginResult> {
  const codeFieldName = `${challengeName}_CODE`;

  const result = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ChallengeName: challengeName as any,
      Session: session,
      ChallengeResponses: { USERNAME: email, [codeFieldName]: code },
    })
  );

  if (!result.AuthenticationResult) {
    throw new Error(`Unexpected additional challenge: ${result.ChallengeName}`);
  }

  const { IdToken, AccessToken, RefreshToken, ExpiresIn } = result.AuthenticationResult;
  storeTokens(IdToken!, AccessToken!, RefreshToken!, ExpiresIn ?? 3600);
  return { step: 'DONE' };
}

async function refreshTokens(refreshToken: string): Promise<StoredSession | null> {
  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      })
    );

    if (!result.AuthenticationResult) return null;

    const { IdToken, AccessToken, ExpiresIn } = result.AuthenticationResult;
    const stored: StoredSession = {
      idToken: IdToken!,
      accessToken: AccessToken!,
      refreshToken,
      expiresAt: Date.now() + (ExpiresIn ?? 3600) * 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function signOutCurrentUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return readSession() !== null;
}

export async function getIdToken(): Promise<string | null> {
  let session = readSession();
  if (!session) return null;

  if (session.expiresAt <= Date.now() + 30_000) {
    session = await refreshTokens(session.refreshToken);
  }

  return session ? session.idToken : null;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  // Handle UTF-8 characters in claims (e.g. accented names).
  const decoded = decodeURIComponent(
    json
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  return JSON.parse(decoded);
}

export interface AppUserClaims {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'admin' | 'provider' | 'parent';
  groups: string[];
}

export function currentClaims(): AppUserClaims | null {
  const session = readSession();
  if (!session) return null;

  let payload: Record<string, unknown>;
  try {
    payload = decodeJwtPayload(session.idToken);
  } catch {
    return null;
  }

  const groups = (payload['cognito:groups'] as string[]) || [];
  const email = (payload.email as string) || '';
  const given = (payload.given_name as string) || '';
  const family = (payload.family_name as string) || '';
  const fullName = (payload.name as string) || [given, family].filter(Boolean).join(' ') || email;
  const customRole = (payload['custom:role'] as string) || '';

  let role: AppUserClaims['role'] = 'parent';
  if (groups.includes('Admin')) role = 'admin';
  else if (customRole === 'provider') role = 'provider';
  else if (customRole === 'parent') role = 'parent';

  return { email, firstName: given, lastName: family, name: fullName, role, groups };
}

/**
 * Mirrors the Cognito session into the legacy `token` / `user` localStorage keys the
 * rest of the app already reads (Header, home page, dashboards, ApplyWizard).
 */
export function syncLegacyUser() {
  const claims = currentClaims();
  if (!claims) return;
  localStorage.setItem('token', 'cognito');
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: 0,
      first_name: claims.firstName || claims.name.split(' ')[0] || '',
      last_name: claims.lastName || claims.name.split(' ').slice(1).join(' ') || '',
      email: claims.email,
      role: claims.role,
    })
  );
  notifyAuthChange();
}

export function clearLegacyUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  notifyAuthChange();
}
