# Echo IA - Plataforma de IA com Suporte por Chat

> Uma plataforma completa de automação de atendimento ao cliente com IA, widget embarcável e integração com múltiplas fontes de IA.

## 📋 Visão Geral

**Echo IA** é uma plataforma SaaS que permite empresas automatizar seu atendimento ao cliente usando inteligência artificial. O sistema funciona através de:

1. **Dashboard Web** - Interface administrativa para gerenciar conversas, arquivos e configurações
2. **Widget Embarcável** - Chat widget que pode ser integrado em qualquer website
3. **Backend Serverless** - API Convex que processa conversas com IA
4. **Integrações** - Vapi (IA de voz), OpenAI, Custom Agents

### Características Principais

- ✅ **Chat com IA** - Respostas automáticas usando GPT e Agents customizados
- ✅ **Múltiplas Organizações** - Suporte a multi-tenant com Clerk
- ✅ **Internacionalização** - Suporte a English (en) e Português Brasileiro (pt-BR)
- ✅ **Widget Embarcável** - Instale em qualquer website com 1 linha de código
- ✅ **IA de Voz** - Integração com Vapi para atendimento por telefone
- ✅ **Dashboard Completo** - Gerenciamento de conversas, arquivos, billing
- ✅ **Real-time** - Updates em tempo real com Convex
- ✅ **RAG (Retrieval Augmented Generation)** - Busca semântica em documentos
- ✅ **Escalação Automática** - Encaminhar para humanos quando necessário

---

## 🏗️ Arquitetura

### Estrutura do Monorepo

```
echo-ia/
├── apps/                    # Aplicações principais
│   ├── web/                 # Dashboard administrativo (Next.js)
│   ├── widget/              # Widget embarcável (Next.js)
│   └── embed/               # Script de embed (Vite)
│
├── packages/                # Pacotes compartilhados
│   ├── backend/             # Backend Convex + IA
│   ├── ui/                  # Componentes UI (shadcn/ui)
│   ├── math/                # Utilitários
│   ├── eslint-config/
│   └── typescript-config/
│
└── Configuração monorepo (turbo, pnpm)
```

### Stack Tecnológico

| Aspecto | Tecnologia | Versão |
|---------|-----------|---------|
| **Monorepo** | Turbo + pnpm | 2.4.2 + 10.4.1 |
| **Web/Widget** | Next.js | 15.2.3 |
| **Frontend** | React | 19.0.0 |
| **Database** | Convex | 1.25.4 |
| **Autenticação** | Clerk | 6.27.1 |
| **IA** | OpenAI + Agents | - |
| **Voice IA** | Vapi | 2.3.8 |
| **Styling** | Tailwind CSS | 4.0.8 |
| **UI Components** | shadcn/ui + Radix | - |
| **Internacionalização** | next-intl | 4.5.7 |
| **Monitoring** | Sentry | 9.42.1 |

---

## 🚀 Como Começar

### Pré-requisitos

- Node.js >= 20
- pnpm >= 10.4.1
- Git

### Instalação

bash
# 1. Clone o repositório
git clone <repo-url>
cd echo-ia

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local

# 4. Inicie o servidor
pnpm dev

# 5. Acesse
# Dashboard:   http://localhost:3000
# Widget:      http://localhost:3001
# Embed:       http://localhost:3002
```

---

## 📱 Aplicações

### Web Dashboard (`/apps/web`)
- Next.js 15
- Porta: 3000
- Gerencia conversas, arquivos, configurações
- Requer autenticação com Clerk

### Widget (`/apps/widget`)
- Next.js 15
- Porta: 3001
- Chat embarcável
- Sem autenticação (público)

### Embed Script (`/apps/embed`)
- Vite
- Porta: 3002
- Injetor do widget em qualquer website
- Bundle único (~5KB)

---

## 🗄️ Backend (Convex)

Localização: `/packages/backend/convex/`

### Principais Tabelas

- **subscriptions** - Planos de organizações
- **conversations** - Threads de conversa
- **contactSessions** - Sessões anônimas de contato
- **messages** - Histórico de mensagens
- **files** - Documentos para RAG
- **widgetSettings** - Configuração do widget
- **plugins** - Plugins instalados (ex: Vapi)

### Agentes de IA

- **supportAgent.ts** - Processa conversas com IA
- Usa RAG para buscar documentos relevantes
- Escala para humanos quando necessário
- Integra com OpenAI e Vapi

---

## 🔐 Autenticação

**Clerk** - Sistema de autenticação completo

- Sign In/Sign Up
- Multi-org support
- Localização automática (en, pt-BR)
- Webhooks para sincronização

**Middleware** (`middleware.ts`)
- Protege rotas autenticadas
- Força seleção de organização
- Valida JWT de Clerk

---

## 🌍 Internacionalização

**Idiomas**: 🇬🇧 English (en) e 🇧🇷 Português Brasileiro (pt-BR)

**Sistema**: next-intl

Veja [I18N_GUIDE.md](./apps/web/I18N_GUIDE.md) para mais detalhes.

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| **ARQUITETURA.md** | Mapa técnico detalhado |
| **GUIA_DESENVOLVEDOR.md** | Setup, padrões, workflows |
| **GUIA_FUNCIONALIDADES.md** | Features explicadas |
| **GUIA_CONVEX.md** | Backend e banco de dados |
| **GUIA_INTEGRACOES.md** | Clerk, Vapi, OpenAI |
| **I18N_GUIDE.md** | Internacionalização |

---

## 🛠️ Desenvolvimento

bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Format
pnpm format
```

---

## 🚀 Deployment

Checklist:
- [ ] Build sem erros
- [ ] Tests passam
- [ ] Variáveis de ambiente
- [ ] Database migrations
- [ ] Monitoring ativado

---

## 📖 Aprenda Mais

- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Convex Docs](https://docs.convex.dev)
- [Vapi Docs](https://vapi.ai/docs)
- [OpenAI Docs](https://platform.openai.com/docs)

---

## 📄 Licença

MIT License

---

**Última atualização**: Dezembro 2024

**Status**: ✅ Desenvolvimento ativo

**Version**: 0.0.1
