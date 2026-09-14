// Social Security Number formatting, shared by every SSN input/display in the app.

/**
 * Format a Social Security Number as XXX-XX-XXXX. Accepts raw digits or an
 * already-formatted value; strips non-digits and formats progressively so it
 * also works as you type. Stored value stays digits-only.
 */
export function formatSsn(raw: string | null | undefined): string {
  const d = (raw ?? '').replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
