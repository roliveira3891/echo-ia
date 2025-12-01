# Exemplos Práticos de Internacionalização

Este arquivo contém exemplos reais de como usar o sistema de i18n em diferentes contextos.

## 📝 Exemplo 1: Server Component com getTranslations

```tsx
// app/[locale]/conversations/page.tsx
import { getTranslations } from 'next-intl/server';
import { ConversationList } from '@/modules/conversations/components/list';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('dashboard.conversations'),
    description: t('dashboard.startConversation'),
  };
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <div>
      <h1>{t('navigation.conversations')}</h1>
      <p>{t('dashboard.noConversations')}</p>
      <ConversationList />
    </div>
  );
}
```

## 🎯 Exemplo 2: Client Component com useTranslations

```tsx
// components/sign-in-form.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';

export function SignInForm() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Logic here...
    } catch (err) {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder={t('auth.email')}
        required
      />
      <Input
        type="password"
        placeholder={t('auth.password')}
        required
      />
      {error && <p className="text-red-600">{error}</p>}
      <Button disabled={loading}>
        {loading ? t('common.loading') : t('auth.signIn')}
      </Button>
    </form>
  );
}
```

## 🌐 Exemplo 3: Componente com Language Switcher

```tsx
// components/header.tsx
'use client';

import { LanguageSwitcher } from '@/components/language-switcher';
import { UserButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

export function Header() {
  const t = useTranslations();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-2xl font-bold">{t('common.appName')}</h1>

      <nav className="flex items-center gap-4">
        <a href="/conversations">{t('navigation.conversations')}</a>
        <a href="/files">{t('navigation.files')}</a>
        <a href="/settings">{t('navigation.settings')}</a>

        <LanguageSwitcher />
        <UserButton />
      </nav>
    </header>
  );
}
```

## 🎨 Exemplo 4: Form com Validações Localizadas

```tsx
// components/create-org-form.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';

export function CreateOrgForm() {
  const t = useTranslations();

  // Schema com mensagens localizadas
  const schema = z.object({
    name: z
      .string()
      .min(1, t('validation.nameRequired'))
      .min(3, t('validation.invalidInput')),
    email: z
      .string()
      .email(t('validation.emailInvalid')),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(async (data) => {
      // Submit logic
    })}>
      <div>
        <label>{t('auth.organizationName')}</label>
        <Input {...register('name')} placeholder={t('auth.organizationName')} />
        {errors.name && <span className="text-red-600">{errors.name.message}</span>}
      </div>

      <div>
        <label>{t('auth.email')}</label>
        <Input {...register('email')} type="email" placeholder={t('auth.email')} />
        {errors.email && <span className="text-red-600">{errors.email.message}</span>}
      </div>

      <Button type="submit">{t('auth.createOrganization')}</Button>
    </form>
  );
}
```

## 🗂️ Exemplo 5: Obter Locale Atual

```tsx
// components/locale-display.tsx
'use client';

import { useLocale } from '@/i18n/hooks';
import { localeNames } from '@/i18n/config';

export function LocaleDisplay() {
  const locale = useLocale();
  const localeName = localeNames[locale];

  return (
    <div>
      <p>Código: {locale}</p>
      <p>Nome: {localeName}</p>
    </div>
  );
}
```

## 📦 Exemplo 6: API Route com Resposta Localizada

```tsx
// app/[locale]/api/messages/route.ts
import { getTranslations } from 'next-intl/server';

export async function GET(req: Request, { params }: { params: { locale: string } }) {
  const locale = params.locale;
  const t = await getTranslations({ locale });

  return Response.json({
    greeting: t('dashboard.welcome'),
    addText: t('dashboard.addButton'),
    locale,
  });
}
```

## 🔄 Exemplo 7: Componente Condicional por Idioma

```tsx
// components/promotional-banner.tsx
'use client';

import { useLocale } from '@/i18n/hooks';
import { useTranslations } from 'next-intl';

export function PromotionalBanner() {
  const locale = useLocale();
  const t = useTranslations();

  // Diferentes mensagens para diferentes regiões
  if (locale === 'pt-BR') {
    return (
      <div className="bg-blue-100 p-4">
        <p>{t('common.appName')} - Sua IA em português!</p>
      </div>
    );
  }

  return (
    <div className="bg-green-100 p-4">
      <p>{t('common.appName')} - Powered by AI</p>
    </div>
  );
}
```

## 🧩 Exemplo 8: Hook Customizado para Lógica Específica

```tsx
// hooks/useLocalizedDate.ts
'use client';

import { useLocale } from '@/i18n/hooks';

export function useLocalizedDate() {
  const locale = useLocale();

  const format = (date: Date): string => {
    if (locale === 'pt-BR') {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return { format };
}

// Uso
// const { format } = useLocalizedDate();
// <p>{format(new Date())}</p>
```

## 📊 Exemplo 9: Tabela com Headers Localizados

```tsx
// components/conversations-table.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Table, TableHeader, TableRow, TableCell } from '@workspace/ui/components/table';

export function ConversationsTable({ conversations }: { conversations: any[] }) {
  const t = useTranslations();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>{t('dashboard.conversation')}</TableCell>
          <TableCell>{t('common.edit')}</TableCell>
          <TableCell>{t('common.delete')}</TableCell>
        </TableRow>
      </TableHeader>
      <tbody>
        {conversations.map((conv) => (
          <TableRow key={conv.id}>
            <TableCell>{conv.title}</TableCell>
            <TableCell>
              <button>{t('common.edit')}</button>
            </TableCell>
            <TableCell>
              <button>{t('common.delete')}</button>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
```

## 🛡️ Exemplo 10: Error Boundary Localizado

```tsx
// components/error-boundary.tsx
'use client';

import { useTranslations } from 'next-intl';

export function ErrorBoundary({ error }: { error: Error }) {
  const t = useTranslations();

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">{t('errors.error')}</h1>
      <p>{t('errors.serverError')}</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        {t('errors.tryAgain')}
      </button>
    </div>
  );
}
```

---

## 🎓 Dicas Importantes

1. **Sempre use chaves estruturadas**: `dashboard.welcome` em vez de `welcome`
2. **Mantenha consonância**: Mesmas chaves em en.json e pt-BR.json
3. **Teste ambos idiomas**: Verifique visualmente que tudo funciona
4. **Use type-safety**: Use `useLocale()` em vez de `useRouter().locale`
5. **Evite hardcodes**: Sempre traduzir textos do usuário

---

## 🚀 Padrão Recomendado para Novos Componentes

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '@/i18n/hooks';

export function MyComponent() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div>
      {/* Use t() para todos os textos visíveis ao usuário */}
      <h1>{t('namespace.key')}</h1>
      {/* Use locale apenas quando precisa de lógica específica */}
      {locale === 'pt-BR' && <span>Específico para português</span>}
    </div>
  );
}
```

---

Estes exemplos cobrem a maioria dos casos de uso. Para mais informações, veja `I18N_GUIDE.md`.
