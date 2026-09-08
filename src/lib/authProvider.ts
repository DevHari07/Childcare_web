/**
 * Which auth backend the frontend talks to.
 *
 *   local   — accounts in the app's own `users` table, via /auth/register + /auth/login
 *   cognito — AWS Cognito (admin_create_user + USER_PASSWORD_AUTH)
 *
 * Flip with NEXT_PUBLIC_AUTH_PROVIDER in .env.local (rebuild required — it's
 * inlined at build time). Defaults to "local".
 */
export type AuthProvider = 'local' | 'cognito';

export const AUTH_PROVIDER: AuthProvider =
  (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProvider) === 'cognito' ? 'cognito' : 'local';

export const isLocalAuth = AUTH_PROVIDER === 'local';
export const isCognitoAuth = AUTH_PROVIDER === 'cognito';
