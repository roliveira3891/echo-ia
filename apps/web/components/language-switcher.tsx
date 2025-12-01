'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/hooks';
import { locales, localeNames, type Locale } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

/**
 * Componente para trocar o idioma da aplicação
 * Substitui o locale na URL e redireciona o usuário
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  function handleLanguageChange(newLocale: Locale) {
    if (newLocale === currentLocale) return;

    // Remover o locale atual da URL
    const segments = pathname.split('/').filter(Boolean);
    const pathWithoutLocale = segments.length > 1
      ? '/' + segments.slice(1).join('/')
      : '/';

    // Adicionar o novo locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    router.push(newPath);
  }

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeNames[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
