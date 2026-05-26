import { useState, useEffect, useCallback } from 'react';
import { t, getLocale, setLocale, type Locale, type TranslationKey } from '@/lib/i18n';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    const handler = (e: Event) => setLocaleState((e as CustomEvent<Locale>).detail);
    window.addEventListener('locale-change', handler);
    return () => window.removeEventListener('locale-change', handler);
  }, []);

  const changeLocale = useCallback((l: Locale) => {
    setLocale(l);
    setLocaleState(l);
  }, []);

  const translate = useCallback((key: TranslationKey) => t(key), [locale]);

  return { locale, changeLocale, t: translate };
}
