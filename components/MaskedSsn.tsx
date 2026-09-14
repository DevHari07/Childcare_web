'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatSsn } from '@/lib/ssn';

/**
 * Read-only SSN display for review/summary screens. Shows a fixed mask by
 * default; the eye button reveals the real number for as long as it's toggled
 * on. Renders "—" when there's no SSN to show, matching the surrounding
 * review fields' empty-value convention.
 */
export default function MaskedSsn({ value }: { value: string | null | undefined }) {
  const [revealed, setRevealed] = useState(false);
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return <>—</>;

  return (
    <span className="masked-ssn">
      <span>{revealed ? formatSsn(digits) : '•••-••-••••'}</span>
      <button
        type="button"
        className="masked-ssn-toggle"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? 'Hide SSN' : 'Show SSN'}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
      </button>
    </span>
  );
}
