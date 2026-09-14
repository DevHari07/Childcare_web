'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatSsn } from '@/lib/ssn';

type SsnFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  /** Raw digits (no dashes), or ''. */
  value: string;
  /** Called with raw digits as the applicant types. */
  onChange: (digits: string) => void;
};

/**
 * SSN input, masked like a password field by default (XXX-XX-XXXX shows as
 * dots) with an eye button to reveal it. Drop-in replacement for a plain
 * `<input>` bound to a digits-only SSN value — `value`/`onChange` still deal
 * in raw digits, only the on-screen rendering changes.
 */
export default function SsnField({ value, onChange, className, style, ...rest }: SsnFieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    // `style` lands here (layout in the caller's flex/grid, e.g. `flex: 1`);
    // `className` lands on the input itself (e.g. a shared "modern-input" look).
    <span className="ssn-field" style={style}>
      <input
        {...rest}
        type={revealed ? 'text' : 'password'}
        inputMode="numeric"
        autoComplete="off"
        placeholder={rest.placeholder ?? '123-45-6789'}
        maxLength={11}
        value={formatSsn(value)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className={className}
      />
      <button
        type="button"
        className="ssn-field-toggle"
        tabIndex={-1}
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? 'Hide SSN' : 'Show SSN'}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
    </span>
  );
}
