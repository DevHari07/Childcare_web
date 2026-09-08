// US date formatting helpers. The app standardises on MM/DD/YYYY for every
// date shown to or typed by a user. Values are still stored/submitted as ISO
// (YYYY-MM-DD) — conversion happens at the UI edge via these helpers and the
// <DateField> component in components/DateField.tsx.

/**
 * Format any ISO date string (`YYYY-MM-DD`, or a full ISO timestamp) as
 * `MM/DD/YYYY`. Already-US strings are normalised (zero-padded). Returns `''`
 * for empty input and passes through anything it can't parse.
 */
export function formatDateUS(value: string | null | undefined): string {
  if (!value) return '';
  const s = String(value).trim();

  // ISO date or timestamp: YYYY-MM-DD[...]
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;

  // Already M/D/YYYY — zero-pad the month and day.
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (us) return `${us[1].padStart(2, '0')}/${us[2].padStart(2, '0')}/${us[3]}`;

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${parsed.getFullYear()}`;
  }
  return s;
}

/**
 * Convert a `MM/DD/YYYY` string to ISO `YYYY-MM-DD`. Returns `''` when the
 * value isn't a complete, real calendar date (so partially-typed input stores
 * nothing until it's valid). ISO input is passed straight through.
 */
export function usToIso(value: string | null | undefined): string {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (!m) return '';
  const mm = m[1].padStart(2, '0');
  const dd = m[2].padStart(2, '0');
  const iso = `${m[3]}-${mm}-${dd}`;
  const d = new Date(`${iso}T00:00:00`);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== Number(m[3]) ||
    d.getMonth() + 1 !== Number(mm) ||
    d.getDate() !== Number(dd)
  ) {
    return '';
  }
  return iso;
}

/**
 * Best-effort parse of an arbitrary date string (ISO, US, or anything
 * `Date` can read like "April 12, 1985") to ISO `YYYY-MM-DD`. Returns `''`
 * when nothing usable can be parsed. Used at import boundaries (e.g. OCR).
 */
export function parseDateToIso(value: string | null | undefined): string {
  if (!value) return '';
  const strict = usToIso(value);
  if (strict) return strict;

  const s = String(value).trim();
  const isoPrefix = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (isoPrefix) return isoPrefix[1];

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Progressive mask for a date being typed: keeps only digits and inserts the
 * slashes, e.g. `04122015` / `4/12/2015` → `04/12/2015`.
 */
export function maskDateInput(raw: string): string {
  const d = String(raw).replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
