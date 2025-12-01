/**
 * Configuração de Internacionalização (i18n)
 * Define locales suportados e suas configurações
 */

export const locales = ['en', 'pt-BR'] as const;
export const defaultLocale = 'pt-BR' as const;

export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
};

/**
 * Função para validar se uma string é um locale válido
 */
export function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && locales.includes(locale as Locale);
}

/**
 * Função para obter locale seguro
 */
export function getSafeLocale(locale: unknown): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}
