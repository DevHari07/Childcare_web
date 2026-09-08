'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { GT_INCLUDED_LANGUAGES, GT_PAGE_LANGUAGE, getGoogleTranslateLanguage } from '@/lib/googleTranslate';

// App code -> Google Translate target (kept in sync with googleTranslate.ts)
const TARGET: Record<string, string> = { en: '', es: 'es', 'es-MX': 'es', hi: 'hi', gu: 'gu' };

const BANNER_SELECTOR = [
  '.goog-te-banner-frame',
  '.VIpgJd-ZVi9od-ORHb-OEVmcd',
  '.VIpgJd-ZVi9od-ORHb-OEVmcd-purZT',
  '#goog-gt-tt',
  '.goog-tooltip',
  '.goog-te-balloon-frame',
].join(',');

/**
 * Loads the Google Translate website widget once, hidden, and translates the
 * whole page. Only our <LanguageSwitcher/> drives it. Google's injected top
 * banner + <body> offset are suppressed below — CSS alone loses to its inline
 * `!important` styles, so we also override them from JS (with guards so the
 * MutationObserver doesn't loop).
 */
export default function GoogleTranslate() {
  useEffect(() => {
    const hideBanners = () => {
      let changed = false;
      document.querySelectorAll<HTMLElement>(BANNER_SELECTOR).forEach((el) => {
        if (el.style.display !== 'none') {
          el.style.setProperty('display', 'none', 'important');
          changed = true;
        }
      });
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.setProperty('top', '0px', 'important');
        changed = true;
      }
      return changed;
    };

    // One-time: force the language once the widget's <select> has mounted.
    let applied = false;
    const applyFromSelection = () => {
      const want = TARGET[getGoogleTranslateLanguage()] || 'en';
      const combo = document.querySelector<HTMLSelectElement>('select.goog-te-combo');
      if (!combo) return;
      if (combo.value !== want) {
        combo.value = want;
        combo.dispatchEvent(new Event('change'));
      }
      applied = true;
    };

    hideBanners();
    const boot = window.setInterval(() => {
      hideBanners();
      if (!applied) applyFromSelection();
      else window.clearInterval(boot);
    }, 300);
    window.setTimeout(() => window.clearInterval(boot), 15000);

    // Debounced observer: only new subtree nodes, no attribute storm.
    let raf = 0;
    const observer = new MutationObserver(() => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        hideBanners();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Cheap session-long safety net for the <body> offset Google re-applies.
    const guard = window.setInterval(hideBanners, 1000);

    return () => {
      window.clearInterval(boot);
      window.clearInterval(guard);
      if (raf) window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" aria-hidden="true" />
      <Script id="gt-init" strategy="afterInteractive">
        {`window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement(
              { pageLanguage: '${GT_PAGE_LANGUAGE}', includedLanguages: '${GT_INCLUDED_LANGUAGES}', autoDisplay: false },
              'google_translate_element'
            );
          };`}
      </Script>
      <Script
        id="gt-element"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
