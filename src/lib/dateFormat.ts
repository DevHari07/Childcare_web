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
  const year = Number(m[3]);
  // Guard against transposed input (e.g. a day typed into the year slot):
  // no date this app collects falls outside this range.
  if (year < 1900 || year > new Date().getFullYear() + 20) return '';
  const iso = `${m[3]}-${mm}-${dd}`;
  const d = new Date(`${iso}T00:00:00`);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
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
 * Progressive mask for a date being typed as MM/DD/YYYY: keeps only digits,
 * inserts the slashes, and constrains each segment to a real calendar range so
 * impossible input can't be entered (month 1–12, day 1–31). A first digit that
 * can only start a two-digit number is auto-padded, e.g. `2` → `02/`, `4` (day)
 * → `/04/`. Examples: `04122015` / `4/12/2015` → `04/12/2015`; `22062023`
 * (typed day-first) → `02/20/6202` — still wrong, but flagged invalid by
 * `usToIso`, never silently a month of 22.
 */
export function maskDateInput(raw: string): string {
  const digits = String(raw).replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  let i = 0;
  // ── month ──────────────────────────────────────────────────────────────
  let mm = digits[i++];
  if (Number(mm) > 1) {
    mm = `0${mm}`; // first digit 2–9 can only mean month 02–09
  } else if (i < digits.length) {
    const m2 = digits[i];
    if (Number(`${mm}${m2}`) >= 1 && Number(`${mm}${m2}`) <= 12) {
      mm += m2; // 01–12: take it
      i++;
    }
    // otherwise (00, 13–19) ignore the 2nd digit and wait for a valid one
  }
  if (mm.length < 2) return mm;

  // ── day ────────────────────────────────────────────────────────────────
  if (i >= digits.length) return `${mm}`;
  let dd = digits[i++];
  if (Number(dd) > 3) {
    dd = `0${dd}`; // first digit 4–9 can only mean day 04–09
  } else if (i < digits.length) {
    const d2 = digits[i];
    if (Number(`${dd}${d2}`) >= 1 && Number(`${dd}${d2}`) <= 31) {
      dd += d2; // 01–31: take it
      i++;
    }
    // otherwise (00, 32–39) ignore the 2nd digit and wait for a valid one
  }
  if (dd.length < 2) return `${mm}/${dd}`;

  // ── year ───────────────────────────────────────────────────────────────
  const yyyy = digits.slice(i, i + 4);
  return yyyy ? `${mm}/${dd}/${yyyy}` : `${mm}/${dd}`;
}
