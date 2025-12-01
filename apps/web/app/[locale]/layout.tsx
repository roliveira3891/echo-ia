import { ClerkProvider } from '@clerk/nextjs'
import { enUS, ptBR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import "@workspace/ui/styles/globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@workspace/ui/components/sonner";
import { type Locale, isValidLocale, defaultLocale } from "@/i18n/config";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

/**
 * Define os metadados dinâmicos da página baseados no locale
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : defaultLocale;

  const siteName = 'Echo IA';
  const descriptions: Record<Locale, string> = {
    'en': 'AI-powered conversations and file management',
    'pt-BR': 'Conversas e gerenciamento de arquivos com IA',
  };

  return {
    title: {
      default: `${siteName}`,
      template: `%s | ${siteName}`,
    },
    description: descriptions[validLocale],
    locale: validLocale,
    alternateLanguages: {
      en: 'https://yoursite.com/en',
      'pt-BR': 'https://yoursite.com/pt-BR',
    },
  };
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode,
  params: Promise<{ locale: string }>
}>) {
  // Aguardar e extrair o locale dos parâmetros
  const awaitedParams = await params;
  const rawLocale = awaitedParams.locale;

  // Validar locale e usar o padrão se inválido
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;

  // Obter as mensagens usando a função getMessages do next-intl
  const messages = await getMessages({ locale });

  // Selecionar localização do Clerk baseado no locale
  const clerkLocalization = locale === 'pt-BR' ? ptBR : enUS;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClerkProvider
            localization={clerkLocalization}
            appearance={{
              variables: {
                colorPrimary: "#3C82F6"
              }
            }}
          >
            <Providers>
              <Toaster />
              {children}
            </Providers>
          </ClerkProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
