'use client';

import { useLocale as useNextIntlLocale } from 'next-intl';
import { isValidLocale, getSafeLocale, type Locale } from './config';

/**
 * Hook para obter o locale atual com type-safety
 */
export function useLocale(): Locale {
  const locale = useNextIntlLocale();
  return getSafeLocale(locale);
}
