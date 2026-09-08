'use client';

import type { LanguageCode } from '@/lib/i18n/languages';

/**
 * Whole-page translation via the Google Translate website widget.
 *
 * The widget reads a `googtrans` cookie (`/<source>/<target>`) on load and
 * translates the entire rendered DOM. We set that cookie from the language
 * switcher and reload — the most reliable way to drive it.
 */

// App language code -> Google Translate target ("" = original English).
const GT_TARGET: Record<LanguageCode, string> = {
  en: '',
  es: 'es',
  'es-MX': 'es', // Google Translate has no Mexican-Spanish variant
  hi: 'hi',
  gu: 'gu',
};

// Languages offered to the widget (source + every distinct target).
export const GT_INCLUDED_LANGUAGES = 'en,es,hi,gu';
export const GT_PAGE_LANGUAGE = 'en';

const COOKIE = 'googtrans';

function cookieDomains(): string[] {
  const host = window.location.hostname;
  // localhost / bare IPs can't take a dotted domain cookie.
  if (host === 'localhost' || /^\d+(\.\d+){3}$/.test(host)) return [''];
  return ['', host, `.${host}`];
}

function writeCookie(value: string | null) {
  for (const domain of cookieDomains()) {
    const base = `${COOKIE}=${value ?? ''}; path=/`;
    const dom = domain ? `; domain=${domain}` : '';
    if (value === null) {
      document.cookie = `${base}${dom}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } else {
      document.cookie = `${base}${dom}`;
    }
  }
}

/** Currently active translation, from the googtrans cookie. */
export function getGoogleTranslateLanguage(): LanguageCode {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return 'en';
  const target = decodeURIComponent(match[1]).split('/').pop() || '';
  const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('gt_language')) as LanguageCode | null;
  if (stored && GT_TARGET[stored] === target) return stored; // keep es vs es-MX label
  const entry = (Object.entries(GT_TARGET) as [LanguageCode, string][]).find(([, v]) => v === target && v !== '');
  return entry ? entry[0] : 'en';
}

/** Switch the whole page to `code`. Tries the live widget first; reloads if it isn't ready. */
export function setGoogleTranslateLanguage(code: LanguageCode) {
  const target = GT_TARGET[code] ?? '';
  try {
    localStorage.setItem('gt_language', code);
  } catch {
    /* ignore */
  }

  // Persist for future page loads.
  if (target) writeCookie(`/${GT_PAGE_LANGUAGE}/${target}`);
  else writeCookie(null);

  // Try to apply immediately via the (hidden) widget <select>.
  const combo = document.querySelector<HTMLSelectElement>('select.goog-te-combo');
  if (combo) {
    combo.value = target || 'en';
    combo.dispatchEvent(new Event('change'));
    // Switching back to English needs a reload to fully strip Google's markup.
    if (!target) window.location.reload();
    return;
  }

  // Widget not mounted yet — a reload will pick up the cookie.
  window.location.reload();
}
