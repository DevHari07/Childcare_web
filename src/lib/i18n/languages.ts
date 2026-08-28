export type LanguageCode = 'en' | 'es' | 'hi' | 'gu' | 'es-MX';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English (US)', nativeLabel: 'English (US)' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'es-MX', label: 'Spanish (Mexico)', nativeLabel: 'Español (México)' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
