'use client';

/** Auth-provider-agnostic helpers for the token and sign-out. */
import { isCognitoAuth } from '@/lib/authProvider';
import { clearLegacyUser, getIdToken, signOutCurrentUser } from '@/lib/cognitoAuth';
import { getToken as getLocalToken, logout as localLogout } from '@/lib/localAuth';

export async function getAuthToken(): Promise<string | null> {
  if (isCognitoAuth) return getIdToken().catch(() => null);
  return getLocalToken();
}

export function signOut(): void {
  if (isCognitoAuth) {
    signOutCurrentUser();
    clearLegacyUser();
  } else {
    localLogout();
  }
}
