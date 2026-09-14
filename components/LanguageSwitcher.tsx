'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/languages';
import { getGoogleTranslateLanguage, setGoogleTranslateLanguage } from '@/lib/googleTranslate';

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLanguage(getGoogleTranslateLanguage());
  }, []);

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

  const choose = (code: LanguageCode) => {
    setOpen(false);
    if (code === language) return;
    // Reflect the choice in the button right away: when the Google Translate
    // widget is already mounted, setGoogleTranslateLanguage() applies the new
    // language in place without a reload, so nothing else would update this.
    setLanguage(code);
    setGoogleTranslateLanguage(code); // sets the googtrans cookie; reloads only if the widget isn't ready
  };

  return (
    <div className="lang-switcher notranslate" translate="no" ref={rootRef}>
      <button
        type="button"
        className="lang-switcher-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
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
                onClick={() => choose(lang.code)}
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
