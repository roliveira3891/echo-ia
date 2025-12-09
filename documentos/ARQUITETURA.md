# Arquitetura Técnica - Echo IA

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                         │
│  ┌──────────────────┐        ┌────────────────────────┐    │
│  │  Web Dashboard   │        │  Widget Embarcável     │    │
│  │  (Next.js 15)    │        │  (Next.js 15)          │    │
│  │  localhost:3000  │        │  localhost:3001        │    │
│  └──────────────────┘        └────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
             │                              │
             └──────────────────┬───────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Embed Script        │
                    │  (IIFE Bundle)       │
                    │  localhost:3002      │
                    └──────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  MIDDLEWARE          │
                    │  - Auth (Clerk)      │
                    │  - i18n Routing      │
                    │  - Org Selection     │
                    └──────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼──────────┐  ┌────────▼────────┐  ┌──────────▼─────┐
│  CONVEX BACKEND  │  │  CLERK AUTH     │  │  OPENAI API    │
│  (Serverless)    │  │  (OAuth2)       │  │  (GPT-4, etc)  │
│  - Database      │  │  - Users        │  │  - Agents      │
│  - Functions     │  │  - Orgs         │  │  - Prompts     │
│  - Real-time     │  │  - Sessions     │  │  - Embeddings  │
│  - RAG/AI        │  └─────────────────┘  └────────────────┘
└──────────────────┘
        │
        ├─ Supabase/PostgreSQL (RAG Vectors)
        ├─ AWS Secrets Manager
        ├─ File Storage
        └─ WebSockets (Real-time)

    ┌──────────────────┐
    │   VAPI (Voice)   │
    │  - Phone calls   │
    │  - Transcription │
    │  - Voice AI      │
    └──────────────────┘
```

---

## 🏗️ Estrutura de Pastas Detalhada

### Root Monorepo

```
echo-ia/
├── .vscode/                    # Configuração VS Code
├── .gitignore
├── package.json               # Root workspace
├── pnpm-workspace.yaml        # pnpm workspaces config
├── turbo.json                 # Turbo task pipeline
├── tsconfig.json              # TypeScript base config
├── .prettierrc.json           # Prettier formatting
├── .eslintrc.js               # ESLint config
│
├── apps/                      # APLICAÇÕES PRINCIPAIS
│   ├── web/                   # Dashboard (MAIN APP)
│   ├── widget/                # Chat widget
│   └── embed/                 # Embed script
│
├── packages/                  # PACOTES COMPARTILHADOS
│   ├── backend/               # Backend Convex
│   ├── ui/                    # Componentes UI
│   ├── math/                  # Utils matemáticos
│   ├── eslint-config/
│   └── typescript-config/
│
└── docs/                      # (opcional) Documentação estática
```

---

## 📱 APP: Web Dashboard

### Estrutura

```
apps/web/
├── app/                       # Next.js App Router
│   └── [locale]/              # Dynamic locale parameter
│       ├── layout.tsx         # Root layout + providers
│       │
│       ├── (auth)/            # Auth routes group
│       │   ├── sign-in/[[...sign-in]]
│       │   ├── sign-up/[[...sign-up]]
│       │   └── org-selection/[[...org-selection]]
│       │
│       ├── (dashboard)/       # Protected routes group
│       │   ├── layout.tsx
│       │   ├── page.tsx       # Dashboard home
│       │   │
│       │   ├── conversations/
│       │   │   ├── page.tsx          # Lista de conversas
│       │   │   ├── [conversationId]/
│       │   │   │   ├── page.tsx      # Detalhe da conversa
│       │   │   │   └── layout.tsx
│       │   │   └── layout.tsx
│       │   │
│       │   ├── files/
│       │   │   └── page.tsx          # Upload de arquivos
│       │   │
│       │   ├── customization/
│       │   │   └── page.tsx          # Config do widget
│       │   │
│       │   ├── billing/
│       │   │   └── page.tsx          # Planos
│       │   │
│       │   ├── integrations/
│       │   │   └── page.tsx          # Integrações
│       │   │
│       │   └── plugins/vapi/
│       │       └── page.tsx          # Vapi integration
│       │
│       ├── global-error.tsx   # Error boundary
│       ├── favicon.ico
│       └── sentry-example-page/
│
├── modules/                   # Feature-based modules
│   ├── auth/
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   ├── organization-guard.tsx
│   │   │   │   ├── auth-guard.tsx
│   │   │   │   └── ...
│   │   │   └── views/
│   │   │       ├── sign-in-view.tsx
│   │   │       ├── sign-up-view.tsx
│   │   │       └── org-selection-view.tsx
│   │   ├── types/
│   │   ├── hooks/
│   │   └── lib/
│   │
│   ├── dashboard/            # Dashboard principal
│   │   ├── ui/components/
│   │   │   ├── conversations-panel.tsx
│   │   │   ├── dashboard-sidebar.tsx
│   │   │   ├── contact-panel.tsx
│   │   │   └── ...
│   │   └── ui/views/
│   │       ├── conversations-view.tsx
│   │       └── conversation-id-view.tsx
│   │
│   ├── conversations/        # Gerenciar conversas
│   │   ├── hooks/
│   │   ├── components/
│   │   └── types/
│   │
│   ├── customization/        # Config widget
│   │   ├── components/
│   │   ├── hooks/
│   │   └── views/
│   │
│   ├── files/                # Upload de arquivos
│   │   ├── components/
│   │   ├── hooks/
│   │   └── views/
│   │
│   ├── billing/              # Planos e cobrança
│   │   ├── components/
│   │   ├── hooks/
│   │   └── views/
│   │
│   ├── integrations/         # Integrações
│   │   ├── components/
│   │   └── views/
│   │
│   └── plugins/              # Plugins (ex: Vapi)
│       ├── hooks/
│       │   └── use-vapi-data.ts
│       ├── ui/
│       │   ├── components/
│       │   │   ├── vapi-assistants-tab.tsx
│       │   │   ├── vapi-phone-numbers-tab.tsx
│       │   │   ├── vapi-connected-view.tsx
│       │   │   └── plugin-card.tsx
│       │   └── views/
│       │       └── vapi-view.tsx
│       └── types/
│
├── components/              # Componentes globais
│   ├── providers.tsx         # Context providers
│   │   ├── ClerkProvider
│   │   ├── NextIntlProvider
│   │   ├── Jotai Provider
│   │   └── Custom providers
│   │
│   ├── language-switcher.tsx
│   └── ...
│
├── lib/                      # Utilitários
│   ├── country-utils.ts
│   ├── api-client.ts
│   └── ...
│
├── i18n/                     # Internacionalização
│   ├── config.ts             # Locales config
│   ├── request.ts            # Server-side i18n
│   └── hooks.ts              # Client-side hooks
│
├── messages/                 # Tradução
│   ├── en.json              # English
│   └── pt-BR.json           # Português
│
├── middleware.ts             # Auth + i18n routing
├── next.config.mjs           # Config Next.js
├── tsconfig.json
├── package.json
├── components.json           # shadcn/ui config
├── tailwind.config.ts        # Tailwind config
├── postcss.config.mjs        # PostCSS plugins
└── instrumentation.ts        # Sentry setup
```

### Fluxo de Página

```
1. Usuário acessa /pt-BR/conversations
   ↓
2. middleware.ts valida autenticação Clerk
   ↓
3. Se não autenticado → redireciona para sign-in
   ↓
4. Se autenticado mas sem org → redireciona para org-selection
   ↓
5. app/[locale]/(dashboard)/conversations/page.tsx renderiza
   ↓
6. Carrega dados com Convex client
   ├─ getConversations()
   ├─ getRealTimeMessages()
   └─ getContactSession()
   ↓
7. Componentes renderizam com dados + estado Jotai
   ↓
8. Real-time updates via WebSocket
```

---

## 🎛️ APP: Widget

### Estrutura

```
apps/widget/
├── app/
│   ├── page.tsx              # Página widget (recebe ?organizationId=...)
│   ├── layout.tsx
│   └── globals.css
│
├── modules/
│   └── widget/
│       └── ui/
│           └── views/
│               └── widget-view.tsx
│
├── components/               # Componentes widget
│   ├── chat-interface.tsx
│   ├── message-bubble.tsx
│   ├── input-area.tsx
│   ├── suggestions.tsx
│   └── ...
│
├── lib/
│   ├── convex-client.ts
│   ├── api.ts
│   └── ...
│
├── hooks/
│   ├── use-widget-config.ts
│   ├── use-contact-session.ts
│   ├── use-messages.ts
│   └── ...
│
├── types/
│   └── widget.types.ts
│
├── next.config.mjs
├── tsconfig.json
└── package.json
```

### Uso

```html
<!-- Em qualquer website -->
<script
  src="https://echoai.com/embed/widget.js"
  data-organization-id="org_123"
  data-position="bottom-right"
></script>
```

### Fluxo

```
1. Visitante carrega página com script embed
   ↓
2. Embed script baixa widget.js (~5KB)
   ↓
3. Cria iframe apontando para widget app
   ↓
4. Widget page.tsx carrega com organizationId
   ↓
5. createContactSession() → sessão anônima
   ↓
6. Chat interface renderiza
   ↓
7. Mensagens bidirecionais com Convex
```

---

## 🔧 APP: Embed Script

### Estrutura

```
apps/embed/
├── embed.ts                  # Script principal (IIFE)
├── config.ts                 # Configurações
├── icons.ts                  # SVG icons
├── demo.html                 # Demo página
├── landing.html              # Landing
│
├── vite.config.ts           # Vite config (bundler)
├── tsconfig.json
└── dist/widget.js           # Output bundle
```

### Como Funciona

```typescript
// embed.ts
(function() {
  // 1. Parse data-* attributes do script tag
  // 2. Cria div container
  // 3. Injeta styles (CSS)
  // 4. Cria botão flutuante com chat icon
  // 5. Em click, carrega widget em iframe
  // 6. Passa organizationId via URL query
  // 7. Chat abre em bottom-right (ou customizado)
})()
```

---

## 🗄️ PACKAGE: Backend (Convex)

### Estrutura

```
packages/backend/convex/
│
├── schema.ts                 # Definição do banco de dados
│   └── Todas as tables: subscriptions, conversations, messages, etc
│
├── auth.config.ts            # Clerk integration
│
├── http.ts                   # HTTP endpoints
│   └── Webhooks (Clerk, Stripe, etc)
│
├── playground.ts             # Convex Playground IA
│
├── users.ts                  # Funções de usuário
│
├── constants.ts              # Configurações constantes
│
├── convex.config.ts          # Config Convex
│
├── lib/
│   ├── extractTextContent.ts # Parser de PDFs
│   ├── secrets.ts            # AWS Secrets Manager
│   └── ...
│
├── private/                  # Funções privadas (apenas servidor)
│   ├── conversations.ts      # Lógica de conversas
│   ├── contactSessions.ts    # Sessões de contato
│   ├── messages.ts           # Mensagens
│   ├── widgetSettings.ts     # Config widget
│   ├── secrets.ts            # Secrets
│   ├── plugins.ts            # Plugins
│   ├── files.ts              # Upload files
│   └── vapi.ts               # Vapi integration
│
├── public/                   # Funções públicas (cliente pode chamar)
│   ├── conversations.ts
│   ├── contactSessions.ts
│   ├── messages.ts
│   ├── widgetSettings.ts
│   ├── organizations.ts
│   └── secrets.ts
│
├── system/                   # Lógica de sistema
│   ├── contactSessions.ts    # Cleanup de sessões expiradas
│   ├── conversations.ts      # Gerenciar status
│   ├── plugins.ts            # Plugin lifecycle
│   ├── secrets.ts            # Sync secrets
│   ├── subscriptions.ts      # Planos
│   │
│   └── ai/                   # Motor de IA
│       ├── rag.ts            # RAG (Retrieval Augmented Generation)
│       ├── constants.ts      # Prompts
│       │
│       ├── agents/
│       │   └── supportAgent.ts    # Agente principal
│       │       └── Processa conversas com IA
│       │       └── Tools: search, escalate, resolve
│       │
│       └── tools/
│           ├── search.ts          # Busca em RAG
│           ├── escalateConversation.ts
│           └── resolveConversation.ts
│
├── _generated/               # Gerado automaticamente
│   └── api.d.ts              # Type definitions
│
├── tsconfig.json
├── convex.config.ts
└── README.md
```

### Banco de Dados (Schema)

```typescript
defineTable({
  subscriptions: {
    organizationId: v.id("organizations"),
    status: v.string(),  // "active", "trial", "canceled"
    planId: v.string(),
    createdAt: v.number()
  },
  
  widgetSettings: {
    organizationId: v.id("organizations"),
    greetMessage: v.string(),
    defaultSuggestions: v.array(v.string()),
    vapiSettings: v.object({
      assistantId: v.string(),
      phoneNumbers: v.array(v.string()),
      enabled: v.boolean()
    }),
    customBranding: v.optional(v.object({
      logoUrl: v.string(),
      primaryColor: v.string(),
      accentColor: v.string()
    }))
  },

  conversations: {
    threadId: v.string(),
    organizationId: v.id("organizations"),
    contactSessionId: v.id("contactSessions"),
    status: v.string(),  // "unresolved", "escalated", "resolved"
    metadata: v.object({
      sentiment: v.optional(v.string()),
      category: v.optional(v.string()),
      priority: v.optional(v.string())
    }),
    createdAt: v.number(),
    updatedAt: v.number()
  },

  contactSessions: {
    name: v.string(),
    email: v.string(),
    organizationId: v.id("organizations"),
    expiresAt: v.number(),  // TTL
    metadata: v.object({
      userAgent: v.string(),
      language: v.string(),
      timezone: v.string(),
      country: v.string(),
      ipAddress: v.string()
    })
  },

  messages: {
    conversationId: v.id("conversations"),
    sender: v.string(),  // "ai", "human", "system"
    content: v.string(),
    contentType: v.optional(v.string()),  // "text", "voice", "file"
    metadata: v.optional(v.object({
      confidence: v.optional(v.number()),
      source: v.optional(v.string())
    })),
    createdAt: v.number()
  },

  files: {
    organizationId: v.id("organizations"),
    filename: v.string(),
    contentType: v.string(),
    storageId: v.string(),
    uploadedAt: v.number(),
    embeddingVector: v.optional(v.array(v.number()))
  },

  plugins: {
    organizationId: v.id("organizations"),
    service: v.string(),  // "vapi", "stripe", etc
    enabled: v.boolean(),
    config: v.object({}),
    secretName: v.string(),  // AWS Secrets Manager
    createdAt: v.number()
  }
})
```

### Fluxo de Conversa

```
1. Widget cria contactSession
   ├─ name, email, browser info
   └─ expiresAt (24h default)

2. Primeira mensagem enviada
   ├─ createConversation()
   ├─ threading por threadId
   └─ status: "unresolved"

3. messages.sendMessage()
   ├─ Armazena mensagem
   ├─ Real-time dispatch
   └─ Trigger AI

4. supportAgent.ts processa
   ├─ Busca contexto (RAG)
   ├─ Formata prompt
   ├─ Chama OpenAI streaming
   ├─ Aplica tools:
   │  ├─ search() → busca em documentos
   │  ├─ escalateConversation() → escalada
   │  └─ resolveConversation() → fechamento
   └─ Retorna resposta

5. Resposta armazenada
   ├─ updateConversationStatus()
   ├─ broadcast para clientes
   └─ Dashboard notificado

6. Dashboard mostra
   ├─ Nova mensagem em real-time
   ├─ Human pode responder
   ├─ ou Resolver/Escalar
   └─ Metadata exibida
```

---

## 📦 PACKAGE: UI Components

### Estrutura

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui + Radix
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast (Sonner)
│   │   │   ├── theme-toggle.tsx    # Custom
│   │   │   └── ... (53+ componentes)
│   │   │
│   │   └── ai/
│   │       ├── conversation-status-icon.tsx
│   │       ├── dicebear-avatar.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   ├── use-infinite-scroll.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── cn.ts                  # clsx/class merge
│   │   └── ...
│   │
│   ├── styles/
│   │   └── globals.css             # Tailwind + variables
│   │
│   └── postcss.config.mjs          # Tailwind processor
│
├── package.json                    # Exports todos componentes
└── tsconfig.json
```

### Componentes Principais

**Form Components**:
- Input, Textarea, Select, Checkbox, Radio
- Form wrapper com React Hook Form integration
- Zod validation support

**Layout Components**:
- Card, Container, Grid, Flex
- Sidebar, Sheet, Dialog, Popover
- Tabs, Accordion

**Data Components**:
- Table, DataGrid
- Chart (Recharts integration)
- Skeleton loading states

**Feedback Components**:
- Toast (Sonner)
- Alert, Tooltip
- Badge, Progress

**Custom Components**:
- ConversationStatusIcon
- DicebearAvatar
- LanguageSwitcher
- ThemeToggle

---

## 🔌 Integrações

### Clerk (Autenticação)

```typescript
// Fluxo
1. User acessa /sign-in
2. Clerk SignIn component
3. JWT token gerado
4. Middleware valida
5. ClerkProvider wraps app
6. useAuth() acessível em componentes

// Multi-org
1. Criar organização em sign-up
2. Clerk cria organization
3. User setado como owner
4. Middleware força selection se múltiplas
```

### Convex (Backend)

```typescript
// Fluxo
1. ConvexReactClient() criado
2. useQuery() subscriptions real-time
3. useMutation() para ações
4. Auth automático com Clerk JWT

// Real-time
- Websocket connection
- Live queries (subscribe)
- Automatic refetch on updates
- Optimistic updates
```

### OpenAI (IA)

```typescript
// supportAgent.ts
1. getMessages() histórico
2. formatPrompt() com contexto
3. openai.beta.assistants.messages.create()
4. Streaming response
5. armazenarResposta()
```

### Vapi (Voice)

```typescript
// vapi-view.tsx
1. Fetch assistants da API Vapi
2. Listar phone numbers
3. Integrar webhook para eventos
4. Configurar em widgetSettings
5. Widget detecta Vapi enabled
6. Oferece opção voice call
```

---

## 🔐 Segurança

### Autenticação

- **JWT**: Clerk emite JWTs
- **Middleware**: Valida em todas as rotas
- **organizationId**: Isolamento por tenant
- **Server Functions**: Verificam auth server-side

### Secrets

- AWS Secrets Manager
- Vapi keys armazenados encrypted
- Environment variables isoladas por env
- Never exposed to client

### Rate Limiting

- Convex: Built-in per-project limits
- API: Rate limit headers via Convex

---

## 📊 Real-time Updates

### WebSocket (Convex)

```typescript
// Cliente
const messages = useQuery(api.messages.getMessages, {
  conversationId: id
})

// Automático re-render quando novo message criado

// Servidor
mutation sendMessage() {
  db.insert("messages", {...})
  // Subscribers notificados automaticamente
}
```

### Jotai State

```typescript
// Global state sem Redux boilerplate
const conversationAtom = atom(null)
const useConversation = () => useAtom(conversationAtom)

// Components re-render on atom change
```

---

## 🚀 Performance

### Code Splitting

- Turbo cache entre builds
- Next.js dynamic imports
- Widget em iframe isolado
- Embed script lazy-loaded

### Bundle Size

- Web: ~450KB (gzipped)
- Widget: ~250KB
- Embed: ~5KB

### Optimization

- Image optimization (Next.js)
- CSS-in-JS com tailwind
- Tree-shaking
- Minification

---

## 📈 Monitoramento

### Sentry

```typescript
// apps/web/instrumentation.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  // Session replay, error tracking, etc
})
```

### Convex Logs

- Console output (dev)
- Production logs na dashboard Convex
- Query performance metrics

---

## 🔄 Deployment Topology

```
┌─────────────────┐
│  Git Repository │
│  (GitHub)       │
└────────┬────────┘
         │
    ┌────▼─────┐
    │   CI/CD   │
    │ (GitHub   │
    │  Actions) │
    └────┬──────┘
         │
    ┌────▼──────────────────────┐
    │    Build & Test           │
    │ - pnpm install            │
    │ - pnpm lint               │
    │ - pnpm build              │
    │ - pnpm test               │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────┐
    │    Deployment             │
    ├───────────────────────────┤
    │ Frontend:                 │
    │ - Vercel (Next.js apps)   │
    │                           │
    │ Backend:                  │
    │ - Convex (serverless)     │
    │                           │
    │ Database:                 │
    │ - Convex + Supabase       │
    │                           │
    │ Secrets:                  │
    │ - AWS Secrets Manager     │
    └───────────────────────────┘
```

---

## 📝 Convenções de Código

### Naming

```typescript
// Components
export const MyComponent: FC<Props> = () => {}

// Hooks
export function useMyHook() {}

// Utils
export function myUtility() {}

// Constants
export const MY_CONSTANT = "value"

// Types
interface MyType {}
type MyUnion = A | B
```

### Imports

```typescript
// External
import React from 'react'
import { useQuery } from 'react-query'

// Workspace
import { Button } from '@workspace/ui/components/button'
import { api } from '@workspace/backend/_generated/api'

// Local
import { MyComponent } from '@/components/my-component'
import { myUtil } from '@/lib/my-util'
```

### File Organization

```
feature/
├── components/
│   ├── my-component.tsx
│   └── other-component.tsx
├── hooks/
│   └── use-my-hook.ts
├── lib/
│   └── util.ts
├── types/
│   └── my-types.ts
└── index.ts (re-exports)
```

---

Esta é a arquitetura completa do projeto Echo IA!

**Última atualização**: Dezembro 2024
