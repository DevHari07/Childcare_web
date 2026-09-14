'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatDateUS, maskDateInput, usToIso } from '@/lib/dateFormat';

type DateFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  /** ISO value (`YYYY-MM-DD`) or `''`. */
  value: string;
  /** Called with an ISO value (`YYYY-MM-DD`), or `''` while the input is incomplete/invalid. */
  onChange: (iso: string) => void;
};

/**
 * Text input that shows and accepts dates as MM/DD/YYYY while reading and
 * emitting ISO (`YYYY-MM-DD`). Drop-in replacement for `<input type="date">`:
 * the surrounding form state keeps storing ISO exactly as before.
 */
export default function DateField({ value, onChange, onBlur, ...rest }: DateFieldProps) {
  const [text, setText] = useState(() => formatDateUS(value));
  const lastEmitted = useRef(value);

  // Adopt external changes to the ISO value (draft resume, OCR import, reset).
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(formatDateUS(value));
      lastEmitted.current = value;
    }
  }, [value]);

  const handleChange = (raw: string) => {
    const masked = maskDateInput(raw);
    setText(masked);
    const iso = usToIso(masked);
    lastEmitted.current = iso;
    onChange(iso);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const iso = usToIso(text);
    if (iso) setText(formatDateUS(iso));
    onBlur?.(e);
  };

  // A fully typed date that isn't a real calendar date (e.g. 02/30/2023, or a
  // day/month typed in the wrong order). Flag it here so the field itself shows
  // the problem instead of only a generic "required fields" error on submit.
  const invalid = text.length === 10 && !usToIso(text);

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={rest.placeholder ?? 'MM/DD/YYYY'}
      maxLength={10}
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      aria-invalid={invalid || undefined}
      title={invalid ? "Enter a real date as MM/DD/YYYY (month first)" : rest.title}
    />
  );
}
