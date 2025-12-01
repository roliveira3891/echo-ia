# Guia do Desenvolvedor - Echo IA

## 🎯 Comece Aqui

Este guia é para **novos desenvolvedores** que querem entender e contribuir ao projeto.

### Pré-requisitos

- Node.js >= 20
- pnpm >= 10.4.1
- Git
- VS Code (recomendado)
- Conhecimento de: React, TypeScript, Next.js

---

## 🚀 Setup Inicial

### 1. Clone e Instale

```bash
# Clone
git clone <repo-url>
cd echo-ia

# Instale dependências
pnpm install

# (Opcional) Instale Convex CLI
pnpm install -g convex
```

### 2. Configure Variáveis de Ambiente

Crie `.env.local` na raiz:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex
CONVEX_DEPLOYMENT=dev
NEXT_PUBLIC_CONVEX_URL=http://localhost:8000

# OpenAI (para IA)
OPENAI_API_KEY=sk-...

# Vapi (Voice AI)
VAPI_API_KEY=...

# AWS (Secrets)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Sentry (Monitoring)
SENTRY_AUTH_TOKEN=...
```

### 3. Inicie o Servidor

```bash
pnpm dev

# Acesse:
# http://localhost:3000 - Web Dashboard
# http://localhost:3001 - Widget
# http://localhost:3002 - Embed
```

---

## 📂 Estrutura do Projeto

### Onde Está Quê?

```
Echo IA
│
├── apps/web/                    ← Dashboard (MAIN APP)
│   ├── app/[locale]/            ← Rotas/páginas
│   ├── modules/                 ← Features (auth, dashboard, etc)
│   ├── components/              ← Componentes globais
│   ├── lib/                     ← Utilitários
│   ├── i18n/                    ← Tradução (pt-BR, en)
│   └── middleware.ts            ← Proteção de rotas
│
├── apps/widget/                 ← Chat Widget
│   ├── app/page.tsx             ← Widget iframe
│   └── components/              ← Chat components
│
├── apps/embed/                  ← Script injetor
│   └── embed.ts                 ← Script principal
│
├── packages/backend/convex/     ← Backend + Database
│   ├── schema.ts                ← Banco de dados
│   ├── public/                  ← Funções públicas
│   ├── private/                 ← Funções privadas
│   ├── system/ai/               ← Motor de IA
│   └── _generated/              ← Tipos gerados
│
├── packages/ui/                 ← Componentes UI
│   └── src/components/          ← 53+ componentes
│
└── Configuração monorepo (turbo, pnpm)
```

---

## 🔥 Primeiras Alterações

### 1. Adicionar Novo Componente

```typescript
// packages/ui/src/components/my-component.tsx
import React from 'react'

export interface MyComponentProps {
  title: string
  children?: React.ReactNode
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  children
}) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

Depois atualize `package.json` exports:

```json
{
  "exports": {
    "./components/my-component": "./src/components/my-component.tsx"
  }
}
```

### 2. Usar em Web App

```typescript
// apps/web/components/my-feature.tsx
import { MyComponent } from '@workspace/ui/components/my-component'

export function MyFeature() {
  return <MyComponent title="Hello">Content</MyComponent>
}
```

### 3. Adicionar Rota

```typescript
// apps/web/app/[locale]/(dashboard)/my-page/page.tsx
'use client'

import { getTranslations } from 'next-intl/server'

export default async function MyPage() {
  const t = await getTranslations()

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      {/* Seu conteúdo */}
    </div>
  )
}
```

### 4. Adicionar Função Backend

```typescript
// packages/backend/convex/public/my-function.ts
import { query } from './_generated/server'

export const myQuery = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Sua lógica
    return result
  }
})
```

Use no cliente:

```typescript
import { api } from '@workspace/backend/_generated/api'
import { useQuery } from 'convex/react'

export function MyComponent() {
  const data = useQuery(api.myFunction.myQuery, { id: '123' })
  return <div>{data}</div>
}
```

---

## 🏗️ Padrões Comuns

### Pattern 1: Feature Module

```
modules/my-feature/
├── components/
│   ├── my-feature-form.tsx
│   └── my-feature-card.tsx
├── hooks/
│   └── use-my-feature.ts
├── types/
│   └── my-feature.types.ts
└── index.ts (re-exports)
```

### Pattern 2: Server + Client Components

```typescript
// Server component (async, backend)
async function ServerComponent() {
  const data = await getData()
  return <ClientComponent initialData={data} />
}

// Client component (interactive)
'use client'
function ClientComponent({ initialData }) {
  const [state, setState] = useState(initialData)
  return <div onClick={() => setState(...)}>Interactive</div>
}
```

### Pattern 3: Convex Hook

```typescript
import { useMutation, useQuery } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'

export function useMyFeature() {
  const data = useQuery(api.myFeature.get)
  const updateMutation = useMutation(api.myFeature.update)

  const update = async (value) => {
    await updateMutation({ value })
  }

  return { data, update }
}
```

### Pattern 4: Form com Validação

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório')
})

type FormData = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    // Processar...
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <button type="submit">Enviar</button>
    </form>
  )
}
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Inicia tudo
pnpm dev --filter=web       # Só web app

# Build
pnpm build                  # Build completo
pnpm build --filter=web     # Só web app

# Lint & Format
pnpm lint                   # ESLint check
pnpm lint --fix             # Corrige erros
pnpm format                 # Prettier format

# Específicos Convex
convex dev                  # Dev Convex
convex deploy               # Deploy Convex
convex sync                 # Sync schema

# Git
git status                  # Ver mudanças
git add .
git commit -m 'feat: descricao'
git push origin seu-branch
```

---

## 📝 Estilo de Código

### TypeScript

```typescript
// ✅ BOM
interface User {
  id: string
  name: string
  email: string
}

export const getUser = async (id: string): Promise<User> => {
  // implementação
}

// ❌ RUIM
interface User {
  id: any
  name: any
}

export const getUser = (id) => {
  // sem types
}
```

### React Components

```typescript
// ✅ BOM
interface MyComponentProps {
  title: string
  onClick?: () => void
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onClick
}) => {
  return <button onClick={onClick}>{title}</button>
}

// ❌ RUIM
export default function MyComponent(props: any) {
  return <button>{props.title}</button>
}
```

### Imports

```typescript
// ✅ BOM
import { Button } from '@workspace/ui/components/button'
import { useQuery } from 'convex/react'
import { useState } from 'react'

// ❌ RUIM
import Button from '../../../../../../ui/button'
import { useQuery as q } from '../../../backend'
```

---

## 🐛 Debugging

### VS Code

Adicione `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Convex

```bash
# Ver logs do Convex dev server
convex logs

# Inspecionar database
convex run --function system:listAllTables
```

### Console

```typescript
// Logs úteis
console.log('Development:', { data, state })
console.warn('Warning:', error)
console.error('Critical error:', error)

// Breakpoints em Dev Tools
debugger
```

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Limpar cache
rm -rf .next node_modules/.turbo
pnpm install
pnpm build
```

### Convex Error: "No deployment found"

```bash
# Conectar Convex
convex auth login
convex dev
```

### Tipos não aparecem

```bash
# Regenerar tipos Convex
convex sync
```

### Widget não carrega

1. Verifique `organizationId` válido
2. Verificar CORS em Convex
3. Check console do browser (F12)

---

## 📚 Recursos Úteis

### Documentação

- [README_PROJECT.md](./README_PROJECT.md) - Visão geral
- [ARQUITETURA.md](./ARQUITETURA.md) - Mapa técnico
- [GUIA_FUNCIONALIDADES.md](./GUIA_FUNCIONALIDADES.md) - Features

### Docs Externas

- [Next.js Docs](https://nextjs.org)
- [React Docs](https://react.dev)
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Comunidade

- GitHub Issues para bugs
- GitHub Discussions para ideias
- Discord (link do servidor)

---

## ✅ Checklist: Primeira Contribuição

- [ ] Setup local funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Entendo a estrutura do projeto
- [ ] Li ARQUITETURA.md
- [ ] Criei uma branch (`git checkout -b feature/xxx`)
- [ ] Fiz minha alteração
- [ ] Rodei `pnpm lint` e `pnpm build`
- [ ] Testei localmente
- [ ] Fiz commit com mensagem clara
- [ ] Abri PR com descrição

---

## 🎓 Próximos Passos

1. **Explorar o código**
   - Leia um módulo completo (auth, dashboard)
   - Entenda o fluxo de uma feature

2. **Fazer uma alteração simples**
   - Corrigir um typo
   - Adicionar um componente
   - Melhorar documentação

3. **Trabalhar em um issue**
   - Pick um issue "good first issue"
   - Implemente a solução
   - Envie PR

4. **Aprofundar**
   - Estude Convex em profundidade
   - Entenda o motor de IA
   - Trabalhe com Vapi

---

**Bem-vindo ao Echo IA! 🚀**

Dúvidas? Abra uma issue ou pergunta no Discord!

**Última atualização**: Dezembro 2024
