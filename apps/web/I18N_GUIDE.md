# Guia de Internacionalização (i18n)

Este documento descreve como usar o sistema de internacionalização (i18n) da aplicação.

## Visão Geral

A aplicação suporta dois idiomas:
- **English (en)**
- **Português Brasileiro (pt-BR)** - idioma padrão

O sistema está configurado com:
- **next-intl**: Biblioteca de internacionalização para Next.js
- **Clerk**: Autenticação com suporte a localizações
- **Arquivos JSON**: Armazenamento de mensagens em `/messages`

## Estrutura de Pastas

```
apps/web/
├── i18n/
│   ├── config.ts        # Configuração de locales e utilitários
│   ├── hooks.ts         # Hooks customizados para i18n
│   └── request.ts       # Configuração do servidor
├── messages/
│   ├── en.json          # Mensagens em inglês
│   └── pt-BR.json       # Mensagens em português
└── components/
    └── language-switcher.tsx  # Componente para trocar idioma
```

## Como Usar em Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations();

  return <h1>{t('dashboard.welcome')}</h1>;
}
```

## Como Usar em Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();

  return <h1>{t('dashboard.welcome')}</h1>;
}
```

### Obter Locale Atual

```tsx
'use client';

import { useLocale } from '@/i18n/hooks';

export default function MyComponent() {
  const locale = useLocale(); // 'en' | 'pt-BR'

  return <p>Idioma atual: {locale}</p>;
}
```

## Estrutura de Mensagens

As mensagens estão organizadas em grupos hierárquicos:

```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar"
  },
  "auth": {
    "signIn": "Entrar",
    "email": "Email"
  },
  "dashboard": {
    "welcome": "Bem-vindo",
    "title": "Dashboard"
  }
}
```

### Padrão de Nomes

Use a convenção `namespace.key`:
- `common.save` - Ações genéricas
- `auth.signIn` - Páginas de autenticação
- `dashboard.welcome` - Dashboard
- `navigation.home` - Navegação
- `errors.notFound` - Mensagens de erro
- `validation.emailRequired` - Validações

## Usar o Language Switcher

```tsx
'use client';

import { LanguageSwitcher } from '@/components/language-switcher';

export default function Header() {
  return (
    <header>
      <h1>Minha App</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

## Adicionar Novo Idioma

Para adicionar um novo idioma (ex: Espanhol):

1. **Criar arquivo de mensagens:**
   ```
   messages/es.json
   ```

2. **Atualizar configuração:**
   ```typescript
   // i18n/config.ts
   export const locales = ['en', 'pt-BR', 'es'] as const;

   export const localeNames: Record<Locale, string> = {
     en: 'English',
     'pt-BR': 'Português (Brasil)',
     'es': 'Español',
   };
   ```

3. **Atualizar middleware:**
   ```typescript
   // middleware.ts
   const VALID_LOCALES = ['en', 'pt-BR', 'es'] as const;
   ```

4. **Atualizar next.config.mjs (se necessário):**
   Certifique-se de que o redirecionamento funciona com o novo idioma.

## Metadata com i18n

O layout principal define metadados baseados no locale:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : defaultLocale;

  return {
    title: 'Echo IA',
    description: descriptions[validLocale], // Descrição localizada
    locale: validLocale,
  };
}
```

## Integração com Clerk

O Clerk está automaticamente localizado:

```tsx
// app/[locale]/layout.tsx
<ClerkProvider
  localization={locale === 'pt-BR' ? ptBR : enUS}
  // ... outros props
>
```

Os componentes do Clerk (SignIn, SignUp, UserButton, etc.) automaticamente seguem o locale selecionado.

## Boas Práticas

1. **Sempre use chaves estruturadas**: `dashboard.welcome` em vez de `welcomeText`
2. **Mantenha consonância**: Chaves em inglês nos arquivos JSON
3. **Agrupe relacionados**: Coloque textos relacionados no mesmo namespace
4. **Evite hardcodes**: Sempre use `t('key')` em vez de texto em inglês
5. **Teste ambos idiomas**: Verifique se as traduções funcionam corretamente
6. **Validações**: Use as chaves em `validation.*` para mensagens de formulário

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se os arquivos JSON estão em `/messages`
- Certifique-se do formato correto do JSON

### Mensagens não aparecem
- Verifique se a chave existe no JSON
- Use `t('namespace.key')` sem namespace inteiro
- Verifique o console para erros de carregamento

### Locale não muda
- Certifique-se de usar `LanguageSwitcher` ou redirecionar manualmente
- Verifique o URL: deve conter `/en` ou `/pt-BR`
- Limpe o cache do navegador

## Arquivos de Referência

- Configuração: `i18n/config.ts`
- Mensagens: `messages/*.json`
- Hooks: `i18n/hooks.ts`
- Layout: `app/[locale]/layout.tsx`
- Middleware: `middleware.ts`
- Componente: `components/language-switcher.tsx`
