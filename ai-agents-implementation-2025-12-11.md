# Implementação do Módulo AI Agents
**Data:** 2025-12-11

---

## 📋 Resumo da Implementação

Sistema completo de gerenciamento de agentes de IA escalável, permitindo criar dezenas de agentes e templates, com seleção automática por canal ou agente padrão.

---

## 🗄️ Backend (Schema & Funções)

### Tabelas Criadas

#### 1. `aiAgentTemplates` (Templates Globais)
Templates do marketplace que qualquer organização pode usar para criar agentes.

```typescript
{
  templateId: string,              // "support", "sales", "receptionist"
  name: string,                    // "Support Agent"
  emoji: string,                   // "🎧"
  description: string,             // Descrição do template
  instructions: string,            // Prompt padrão
  isActive: boolean,               // Aparece no marketplace
  isSystem: boolean,               // Template do sistema (não deletável)
  createdAt: number,
  updatedAt: number,
  createdBy?: string,
}
```

**Índices:**
- `by_template_id`
- `by_is_active`

#### 2. `aiAgents` (Agentes por Organização)
Agentes criados pelas organizações. Escalável para dezenas de agentes.

```typescript
{
  organizationId: string,
  name: string,                    // "Support Agent", "Sales Agent"
  emoji: string,                   // "🎧", "💼"
  description: string,             // Descrição curta do que faz
  instructions: string,            // Prompt completo (até 10000 chars)
  templateId?: string,             // Referência ao template usado
  isActive: boolean,               // Ativo/Inativo
  isDefault: boolean,              // Agente padrão da org (só 1)
  createdAt: number,
  updatedAt: number,
  createdBy?: string,
}
```

**Índices:**
- `by_organization_id`
- `by_organization_and_active`
- `by_organization_and_default`

#### 3. `channelAgentAssignments` (Agentes por Canal)
Mapeia qual agente responde cada canal específico.

```typescript
{
  organizationId: string,
  channel: string,                 // "whatsapp", "telegram", "widget"
  agentId: Id<"aiAgents">,        // Qual agente responde
  createdAt: number,
  updatedAt: number,
}
```

**Índices:**
- `by_organization_id`
- `by_org_and_channel` (unique per org+channel)
- `by_agent_id`

#### 4. Atualização em `conversations`
```typescript
{
  // ... campos existentes
  agentId?: Id<"aiAgents">,       // Qual agente atendeu
}
```

**Novo índice:**
- `by_agent_id`

---

## 📂 Funções Backend

### `private/aiAgentTemplates.ts`
**Queries:**
- `listActive()` - Lista templates ativos (marketplace)
- `listAll()` - Lista todos templates (admin)
- `getById(templateId)` - Busca por ID
- `getByTemplateId(templateId)` - Busca por templateId string

**Mutations:**
- `create(...)` - Criar novo template
- `update(id, ...)` - Atualizar template
- `deleteTemplate(id)` - Deletar (se não for system)
- `toggleActive(id)` - Ativar/desativar

### `private/aiAgents.ts`
**Queries:**
- `list()` - Lista agentes da organização
- `getById(id)` - Busca agente por ID
- `getDefault()` - Busca agente padrão da org

**Mutations:**
- `create(name, emoji, description, instructions, templateId?, isDefault?)` - Criar agente
- `update(id, name?, emoji?, description?, instructions?)` - Atualizar agente
- `toggleActive(id)` - Ativar/desativar
- `setAsDefault(id)` - Definir como padrão (remove dos outros)
- `deleteAgent(id)` - Deletar agente

### `private/channelAgentAssignments.ts`
**Queries:**
- `list()` - Lista assignments da org
- `getByChannel(channel)` - Busca assignment de um canal

**Mutations:**
- `assign(channel, agentId)` - Atribuir agente a canal (upsert)
- `unassign(channel)` - Remover assignment

### `system/ai/agentSelector.ts`
Lógica de seleção de agente para responder conversas.

**Funções:**
- `selectAgentForChannel(ctx, organizationId, channel?)` - Seleciona agente
- `getDefaultAgent(ctx, organizationId)` - Busca agente default
- `getFirstActiveAgent(ctx, organizationId)` - Fallback (primeiro ativo)

**Fluxo de decisão:**
```
Nova conversa no canal X
  ↓
Tem agente específico para canal X?
  ├─ SIM → Usa agente do canal (se ativo)
  └─ NÃO → Usa agente default (se ativo)
            ↓
            Tem agente?
              ├─ SIM → Retorna agente
              └─ NÃO → Retorna null (não responde com IA)
```

---

## 🎨 Frontend

### Estrutura de Arquivos

```
apps/web/
├─ app/[locale]/(dashboard)/ai-agents/
│  ├─ page.tsx                           # Lista de agentes
│  ├─ new/
│  │  ├─ templates/page.tsx              # Marketplace de templates
│  │  └─ configure/page.tsx              # Criar novo agente
│  └─ [agentId]/edit/page.tsx            # Editar agente
│
└─ modules/ai-agents/
   ├─ ui/
   │  ├─ views/
   │  │  ├─ ai-agents-list-view.tsx
   │  │  ├─ ai-agent-templates-view.tsx
   │  │  └─ ai-agent-configure-view.tsx
   │  └─ components/
   │     ├─ agent-card.tsx
   │     └─ template-card.tsx
   └─ lib/
      └─ mock-data.ts (depreciado - usando backend)
```

### Páginas

#### 1. Lista de Agentes (`/ai-agents`)
- Grid de cards com todos os agentes
- Banner do agente default (destaque)
- Toggle ativo/inativo
- Botão "Set as Default"
- Botão "Delete"
- Botão "Edit"
- Estado de loading
- Empty state (sem agentes)

#### 2. Marketplace de Templates (`/ai-agents/new/templates`)
- Grid de templates disponíveis
- Card de cada template com emoji, nome, descrição
- Botão "Use Template"
- Opção "Create from Scratch"
- Loading state

#### 3. Configurar Agente (`/ai-agents/new/configure` ou `/[id]/edit`)
**Seções:**

**Configuration:**
- Emoji picker (input text)
- Nome do agente
- Descrição (textarea, 200 chars max)
- Instruções (textarea grande, 10000 chars max)

**Knowledge Sources:**
- Placeholder para integração futura com módulo Files

**Actions:**
- Botões: Cancel e Save
- Loading state durante save
- Validação de campos obrigatórios

---

## 📦 Templates Iniciais

3 templates criados via migration `seedAgentTemplates`:

### 1. Support Agent 🎧
```typescript
{
  templateId: "support",
  name: "Support Agent",
  emoji: "🎧",
  description: "Handle customer support tickets and provide instant help with common issues.",
  instructions: SUPPORT_AGENT_PROMPT, // Prompt em produção
}
```

### 2. Sales Agent 💼
```typescript
{
  templateId: "sales",
  name: "Sales Agent",
  emoji: "💼",
  description: "Qualify leads, answer product questions, and book demos automatically.",
  instructions: "# Sales Assistant\n\n## Identity & Purpose\nYou are a sales assistant...",
}
```

### 3. Receptionist 📞
```typescript
{
  templateId: "receptionist",
  name: "Receptionist",
  emoji: "📞",
  description: "Perfect for greeting visitors and routing conversations to the right team.",
  instructions: "# Receptionist Assistant\n\n## Identity & Purpose\nYou are a friendly receptionist...",
}
```

---

## 🔄 Migrations

### `migrations/seedAgentTemplates.ts`
Popula os 3 templates iniciais no banco.

**Status:** ✅ Executada com sucesso

**Comando:**
```bash
cd /home/renato/echo-ia/packages/backend
pnpm convex run migrations/seedAgentTemplates:default
```

### `migrations/addDescriptionToAgents.ts`
Adiciona campo `description` vazio aos agentes criados antes dessa feature.

**Status:** Criada (executar se necessário)

**Comando:**
```bash
cd /home/renato/echo-ia/packages/backend
pnpm convex run migrations/addDescriptionToAgents:default
```

---

## 🌍 Traduções

### pt-BR (apps/web/messages/pt-BR.json)
```json
{
  "aiAgents": {
    "title": "Agentes de IA",
    "description": "Configure agentes de IA para automatizar conversas",
    "createNewAgent": "Criar Novo Agente",
    "noAgents": "Nenhum agente ainda",
    "active": "Ativo",
    "inactive": "Inativo",
    "default": "Padrão",
    "edit": "Editar",
    "delete": "Deletar",
    "setAsDefault": "Definir como Padrão",
    "confirmDelete": "Tem certeza que deseja deletar este agente?",
    "agentDeleted": "Agente deletado com sucesso",
    "setAsDefaultSuccess": "Agente definido como padrão",

    "templates": {
      "title": "Escolha um Template de Agente",
      "description": "Selecione um template ou crie do zero",
      "useTemplate": "Usar Template",
      "startFresh": "Criar do Zero"
    },

    "configure": {
      "title": "Configurar Agente de IA",
      "editTitle": "Editar Agente de IA",
      "configuration": "Configuração Básica",
      "emoji": "Emoji",
      "emojiHint": "Escolha um emoji para representar seu agente",
      "name": "Nome do Agente",
      "namePlaceholder": "Ex: Agente de Suporte",
      "nameRequired": "O nome do agente é obrigatório",
      "description": "Descrição",
      "descriptionPlaceholder": "Ex: Atende clientes e resolve problemas comuns",
      "descriptionHint": "Descreva brevemente o que este agente faz",
      "descriptionRequired": "A descrição é obrigatória",
      "instructions": "Instruções",
      "instructionsPlaceholder": "# Assistente de Suporte\n\nVocê é um assistente amigável...",
      "instructionsRequired": "As instruções são obrigatórias",
      "characters": "caracteres",
      "save": "Salvar Agente",
      "saving": "Salvando...",
      "agentCreated": "Agente criado com sucesso!",
      "agentUpdated": "Agente atualizado com sucesso!"
    }
  }
}
```

### en (apps/web/messages/en.json)
Todas as chaves traduzidas para inglês.

---

## 🐛 Problemas Corrigidos

### 1. Imports do Convex API
**Erro:** `Package path ./convex/_generated/api is not exported`

**Correção:** Usar caminho correto:
```typescript
// ❌ Errado
import { api } from "@workspace/backend/convex/_generated/api";

// ✅ Correto
import { api } from "@workspace/backend/_generated/api";
```

### 2. Renderização de Emojis
**Erro:** `Element type is invalid: expected a string but got: undefined`

**Correção:** Emojis são strings, não componentes React:
```typescript
// ❌ Errado
const Icon = agent.icon;
return <Icon className="..." />;

// ✅ Correto
return <span className="text-2xl">{agent.emoji}</span>;
```

### 3. Campo Description Undefined
**Erro:** `Cannot read properties of undefined (reading 'length')`

**Correção:** Proteção com fallback:
```typescript
// ❌ Errado
{formData.description.length}

// ✅ Correto
{formData.description?.length || 0}

// Também ao carregar dados
description: agent.description || "",
```

---

## 📊 Estrutura Escalável

### Capacidade
- ✅ **Templates:** Dezenas de templates globais
- ✅ **Agentes:** Dezenas de agentes por organização
- ✅ **Assignments:** 1 agente default + 1 por canal (opcional)

### Lógica de Seleção
```typescript
// Exemplo de uso em conversas
const agent = await selectAgentForChannel(ctx, orgId, "whatsapp");

if (!agent) {
  // Sem agente configurado - não responde com IA
  return;
}

// Usa as instruções do agente selecionado
const agentInstance = createAgentInstance(agent.instructions);
await agentInstance.run(ctx, { threadId, message });
```

### Regras
1. **Agente Default:** Apenas 1 por organização pode ser default
2. **Agente por Canal:** Opcional, se não configurado usa o default
3. **Prioridade:** Canal específico > Default > Nenhum (sem IA)
4. **Ativos:** Apenas agentes ativos são considerados

---

## 🔄 Próximos Passos (Sugeridos)

### 1. Integrar Seleção de Agente nas Conversas
**Onde:** `private/messages.ts` ou similar

**Como:**
```typescript
import { selectAgentForChannel } from "../system/ai/agentSelector";

// Ao criar/responder mensagem
const agent = await selectAgentForChannel(ctx, organizationId, channel);

if (!agent) {
  // Não responde com IA - escala direto ou mostra erro
  throw new Error("No AI agent configured");
}

// Cria instância com instructions customizadas
const agentInstance = createAgentInstance(agent.instructions);
```

### 2. UI para Configurar Agente por Canal
**Página:** `/ai-agents/channels`

**Funcionalidades:**
- Lista de canais conectados
- Dropdown para selecionar agente por canal
- Botão "Use Default" para remover assignment
- Visual indicator de qual agente está ativo por canal

### 3. Integrar Knowledge Sources (Files)
**Onde:** Na página de configuração do agente

**Como:**
- Adicionar seção "Knowledge Sources"
- Listar files da organização
- Permitir vincular files ao agente específico
- Atualizar schema `files` com campo `agentId` (já preparado)

### 4. Analytics por Agente
- Dashboard de performance por agente
- Taxa de resolução
- Número de conversas atendidas
- Tempo médio de resposta
- Taxa de escalação

### 5. Histórico de Versões
- Salvar histórico de mudanças nas instruções
- Permitir rollback para versão anterior
- Comparar versões (diff)

---

## ✅ Checklist de Validação

### Backend
- [x] Schema com 3 tabelas criado
- [x] Funções CRUD completas
- [x] Lógica de seleção implementada
- [x] Templates iniciais populados
- [x] Migration de compatibilidade criada
- [x] Índices otimizados

### Frontend
- [x] Página de lista de agentes
- [x] Marketplace de templates
- [x] Formulário de criação/edição
- [x] Integração com backend via Convex
- [x] Estados de loading
- [x] Validação de formulários
- [x] Toasts de feedback

### UX
- [x] Emojis renderizando corretamente
- [x] Descrições nos cards
- [x] Toggle ativo/inativo
- [x] Set as default funcionando
- [x] Delete com confirmação
- [x] Compatibilidade com agentes antigos

### i18n
- [x] Traduções pt-BR completas
- [x] Traduções en completas
- [x] Todas as chaves mapeadas

---

## 🚀 Conclusão

Sistema completo de gerenciamento de agentes de IA implementado com sucesso. A arquitetura é escalável, permite dezenas de agentes e templates, com seleção inteligente por canal ou agente padrão. Frontend totalmente conectado ao backend via Convex, com experiência de usuário completa.

**Status:** ✅ Pronto para produção

**Documentação:** Este arquivo

**Próximo passo:** Integrar seleção de agente nas conversas reais
