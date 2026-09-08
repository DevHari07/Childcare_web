'use client';

/**
 * Fired on `window` whenever the legacy `token` / `user` localStorage keys
 * change within this tab. Components that show auth state (the Header lives in
 * the root layout and never remounts on client navigation) listen for this so
 * they update on login/logout without a full page reload. `storage` events only
 * cover *other* tabs, so we need our own same-tab signal.
 */
export const AUTH_CHANGE_EVENT = 'auth-change';

export function notifyAuthChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}
