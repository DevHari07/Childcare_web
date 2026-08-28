'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LANGUAGES } from '@/lib/i18n/languages';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        className="lang-switcher-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('header.language')}
      >
        <Globe size={15} strokeWidth={2} />
        <span>{current.nativeLabel}</span>
        <ChevronDown size={14} strokeWidth={2} className={`lang-switcher-caret ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <ul className="lang-switcher-menu" role="listbox">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                className={`lang-switcher-option ${lang.code === language ? 'selected' : ''}`}
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                role="option"
                aria-selected={lang.code === language}
              >
                <span>{lang.nativeLabel}</span>
                {lang.code === language && <Check size={14} strokeWidth={2.5} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
