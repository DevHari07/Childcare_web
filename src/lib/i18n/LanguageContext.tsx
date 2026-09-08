'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type LanguageCode, DEFAULT_LANGUAGE } from './languages';
import type { TranslationKey } from './en';
import en from './en';
import es from './es';
import esMX from './esMX';
import hi from './hi';
import gu from './gu';

const DICTIONARIES: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  es,
  'es-MX': esMX,
  hi,
  gu,
};

const STORAGE_KEY = 'app_language';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    text
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The UI now renders an English base and the Google Translate widget
  // translates the whole DOM (see components/GoogleTranslate.tsx). We keep this
  // provider so every `t()` call still resolves, but it stays on English.
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY); // clear any stale i18n selection
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
  };

  const t = useMemo(() => {
    const dict = DICTIONARIES[language] ?? en;
    return (key: TranslationKey, vars?: Record<string, string | number>) => {
      const raw = dict[key] ?? en[key] ?? key;
      return interpolate(raw, vars);
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
