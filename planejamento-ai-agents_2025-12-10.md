# Planejamento: Módulo AI Agents (VERSÃO FINAL)
**Data:** 2025-12-10

---

## 🎯 Objetivo

Criar um módulo completo de **AI Agents** inspirado no respond.io, onde o usuário pode:
1. Ver todos os agentes configurados
2. Criar novos agentes a partir de **templates** (pré-preenchidos) ou do zero
3. Configurar agentes editando **apenas o prompt principal** (instructions)
4. O módulo **Files** atual será integrado como "Knowledge Sources"
5. Sistema **100% agnóstico** - funciona para qualquer tipo de negócio

---

## 🔑 Decisões Importantes

### ✅ **Templates vs Agentes**
- **Templates** = Modelos pré-preenchidos hardcoded no código (não salvos no banco)
- **Agentes** = Instâncias criadas pelo usuário (salvos no banco)
- **Nada é criado automaticamente** ao criar organização
- Usuário escolhe template ou cria do zero

### ✅ **Prompts Editáveis**
- **Editável:** `instructions` (prompt principal do agente)
- **Hardcoded:** `SEARCH_INTERPRETER_PROMPT` (interno do RAG)
- **Hardcoded:** `OPERATOR_MESSAGE_ENHANCEMENT_PROMPT` (feature de UX)

### ✅ **Migração do Sistema Atual**
- Agente atual (`SUPPORT_AGENT_PROMPT`) **vira Template #1** "Support Agent"
- Para orgs existentes: criar agente automaticamente na migração
- Para novas orgs: usuário cria manualmente

---

## 🗺️ Fluxo de Navegação

```
1. Sidebar
   └─ "AI Agents" (novo item)
       ↓
2. /[locale]/ai-agents (Lista de Agentes)
   ├─ Support Agent (card)
   ├─ Receptionist (card)
   ├─ Sales Agent (card)
   └─ [+ Create New AI Agent] (botão)
       ↓
3. /[locale]/ai-agents/new/templates (Escolher Template)
   ├─ 📞 Receptionist Template
   ├─ 💼 Sales Agent Template
   ├─ 🎧 Support Agent Template
   └─ ✨ Create from Scratch
       ↓
4. /[locale]/ai-agents/new/configure (Configuração do Agente)
   │  OU
   └─ /[locale]/ai-agents/[agentId]/edit (Edição)
       │
       ├─ Configuration Section
       │  ├─ Emoji picker
       │  ├─ Name
       │  └─ Instructions (textarea com AI suggestions)
       │
       ├─ Actions Section
       │  ├─ ☑️ Close conversations
       │  ├─ ☑️ Assign to agent/team
       │  ├─ ☑️ Update Lifecycle stages
       │  ├─ ☑️ Update Contact fields
       │  └─ ☑️ Add comments
       │
       └─ Knowledge Sources Section
          └─ [Files module integration] ← AQUI entra o /files
```

---

## 📁 Estrutura de Rotas

### **Rotas Novas**
```
apps/web/app/[locale]/(dashboard)/
├─ ai-agents/
│  ├─ page.tsx                    → Lista de agentes
│  ├─ new/
│  │  ├─ templates/
│  │  │  └─ page.tsx              → Escolher template
│  │  └─ configure/
│  │     └─ page.tsx              → Configurar novo agente
│  └─ [agentId]/
│     └─ edit/
│        └─ page.tsx              → Editar agente existente
```

### **Rota Absorvida (Files)**
```
❌ REMOVER: /[locale]/files
✅ MOVER PARA: /[locale]/ai-agents/[agentId]/edit#knowledge-sources
   (Files vira uma seção dentro da configuração do agente)
```

---

## 🗄️ Schema do Banco de Dados

### **Nova Tabela: `aiAgents`** (SIMPLIFICADA)
```typescript
aiAgents: defineTable({
  organizationId: v.string(),

  // Configuration (apenas 3 campos principais!)
  name: v.string(),                    // "Support Agent", "Sales Agent"
  emoji: v.string(),                   // "🎧", "💼"
  instructions: v.string(),            // Prompt completo (até 10000 chars)

  // Template info (apenas para referência)
  templateType: v.union(
    v.literal("support"),              // Veio do template Support
    v.literal("sales"),                // Veio do template Sales
    v.literal("receptionist"),         // Veio do template Receptionist
    v.literal("custom")                // Criado do zero
  ),

  // Status
  isActive: v.boolean(),               // Ativo/Inativo (toggle)

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.string()),   // userId do Clerk
})
  .index("by_organization_id", ["organizationId"])
  .index("by_organization_and_active", ["organizationId", "isActive"])
```

**❌ REMOVIDO (não precisa):**
- `actions` → Tools já fazem isso automaticamente
- `isDefault` → Não existe agente padrão, usa o primeiro ativo

### **Tabela Existente: `files` (Atualizar)**
```typescript
files: defineTable({
  // ... campos existentes ...

  // NOVO CAMPO:
  agentId: v.optional(v.id("aiAgents")), // Relacionamento com agente
})
  .index("by_agent_id", ["agentId"]) // Novo índice
```

### **Tabela Existente: `conversations` (Atualizar)**
```typescript
conversations: defineTable({
  // ... campos existentes ...

  // NOVO CAMPO:
  agentId: v.optional(v.id("aiAgents")), // Qual agente está atendendo
})
  .index("by_agent_id", ["agentId"]) // Novo índice
```

---

## 🎨 Páginas e Componentes

### **1. Página: Lista de Agentes** (`/ai-agents`)

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ AI Agents                          [+ Create New Agent]  │
│ Configure AI agents to automate conversations           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌────────────────┐  ┌────────────────┐  ┌─────────────┐│
│ │ 🎧             │  │ 📞             │  │ 💼          ││
│ │ Support Agent  │  │ Receptionist   │  │ Sales Agent ││
│ │ ●  Active      │  │ ○  Inactive    │  │ ●  Active   ││
│ │                │  │                │  │             ││
│ │ 156 convos     │  │ 45 convos      │  │ 89 convos   ││
│ │ [Edit]         │  │ [Edit]         │  │ [Edit]      ││
│ └────────────────┘  └────────────────┘  └─────────────┘│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Cards com preview de cada agente
- Status visual (Ativo/Inativo)
- Estatísticas (número de conversas)
- Toggle para ativar/desativar agente
- Botão "Edit" → `/ai-agents/[agentId]/edit`
- Botão "Create New Agent" → `/ai-agents/new/templates`

**Componente:**
```
apps/web/modules/ai-agents/
├─ ui/
│  ├─ views/
│  │  └─ ai-agents-list-view.tsx
│  └─ components/
│     ├─ agent-card.tsx
│     └─ agent-stats.tsx
```

---

### **2. Página: Escolher Template** (`/ai-agents/new/templates`)

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ ← Back          Choose an AI Agent Template             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Select a template to get started quickly, or create     │
│ your own from scratch.                                   │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📞  Receptionist                                   │  │
│ │     Perfect for greeting visitors and routing      │  │
│ │     conversations to the right team.               │  │
│ │                                    [Use Template]  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 💼  Sales Agent                                    │  │
│ │     Qualify leads, answer product questions,       │  │
│ │     and book demos automatically.                  │  │
│ │                                    [Use Template]  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🎧  Support Agent                                  │  │
│ │     Handle customer support tickets and provide    │  │
│ │     instant help with common issues.               │  │
│ │                                    [Use Template]  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ✨  Create from Scratch                           │  │
│ │     Start with a blank template and configure      │  │
│ │     everything from the ground up.                 │  │
│ │                                    [Start Fresh]   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Templates Pré-configurados:**

#### **Template: Receptionist**
```typescript
{
  name: "Receptionist",
  emoji: "📞",
  instructions: `You are a friendly receptionist for {COMPANY_NAME}. Your role is to:
1. Warmly greet visitors
2. Understand their inquiry
3. Route them to the appropriate team
4. Collect basic information before transfer

Communication style: Professional, warm, and efficient.`,

  actions: {
    closeConversations: { enabled: false },
    assignToAgentOrTeam: { enabled: true, guidelines: "Assign based on inquiry type" },
    updateLifecycleStages: { enabled: true, guidelines: "Move to ACTIVE when engaged" },
    updateContactFields: { enabled: true, guidelines: "Capture name and reason for contact" },
    addComments: { enabled: true, guidelines: "Note the inquiry type" },
  }
}
```

#### **Template: Sales Agent**
```typescript
{
  name: "Sales Agent",
  emoji: "💼",
  instructions: `You are a sales assistant for {COMPANY_NAME}. Your role is to:
1. Qualify leads by asking key questions
2. Answer product questions accurately
3. Share pricing when appropriate
4. Book demos or schedule calls
5. Move qualified leads forward in the pipeline

Communication style: Consultative, knowledgeable, and enthusiastic.`,

  actions: {
    closeConversations: { enabled: true, guidelines: "Close if not qualified" },
    assignToAgentOrTeam: { enabled: true, guidelines: "Assign to sales team for demos" },
    updateLifecycleStages: { enabled: true, guidelines: "Move through sales pipeline" },
    updateContactFields: { enabled: true, guidelines: "Capture company size, budget, timeline" },
    addComments: { enabled: true, guidelines: "Note qualification criteria met" },
  }
}
```

#### **Template: Support Agent**
```typescript
{
  name: "Support Agent",
  emoji: "🎧",
  instructions: `You are a customer support specialist for {COMPANY_NAME}. Your role is to:
1. Understand the customer's issue
2. Provide step-by-step solutions
3. Search knowledge base for answers
4. Escalate complex issues to human agents
5. Follow up to ensure resolution

Communication style: Patient, helpful, and solution-oriented.`,

  actions: {
    closeConversations: { enabled: true, guidelines: "Close when issue is resolved" },
    assignToAgentOrTeam: { enabled: true, guidelines: "Escalate if unable to resolve" },
    updateLifecycleStages: { enabled: true, guidelines: "Track resolution status" },
    updateContactFields: { enabled: true, guidelines: "Log issue type and resolution" },
    addComments: { enabled: true, guidelines: "Document troubleshooting steps" },
  }
}
```

**Componente:**
```
apps/web/modules/ai-agents/
├─ ui/
│  ├─ views/
│  │  └─ ai-agent-templates-view.tsx
│  └─ components/
│     └─ template-card.tsx
```

---

### **3. Página: Configuração do Agente** (`/ai-agents/new/configure` ou `/ai-agents/[agentId]/edit`)

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ ← Back          Configure AI Agent      [Save] [Cancel] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─ Configuration ────────────────────────────────────┐  │
│ │                                                     │  │
│ │ Emoji: [🎧 Pick emoji]                            │  │
│ │                                                     │  │
│ │ Name:  [Support Agent                          ]  │  │
│ │                                                     │  │
│ │ Instructions:                                       │  │
│ │ ┌───────────────────────────────────────────────┐ │  │
│ │ │ You are a customer support specialist...     │ │  │
│ │ │                                               │ │  │
│ │ │ (Large textarea with markdown support)        │ │  │
│ │ │                                               │ │  │
│ │ └───────────────────────────────────────────────┘ │  │
│ │ [💡 Learn how to write effective instructions]   │  │
│ │                                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─ Actions ──────────────────────────────────────────┐  │
│ │                                                     │  │
│ │ Assign actions the AI Agent can take during a     │  │
│ │ conversation. Use the text box to define when     │  │
│ │ the agent should perform the action.              │  │
│ │                                                     │  │
│ │ ☑️  Close conversations                           │  │
│ │     [When to close: Issue resolved, not qualified]│  │
│ │                                                     │  │
│ │ ☑️  Assign to agent or team                       │  │
│ │     [When to assign: Complex issues, sales demos]│  │
│ │                                                     │  │
│ │ ☑️  Update Lifecycle stages                       │  │
│ │     [Guidelines: Move to RESOLVED when closed]   │  │
│ │                                                     │  │
│ │ ☑️  Update Contact fields                         │  │
│ │     [Fields to update: Issue type, resolution]   │  │
│ │                                                     │  │
│ │ ☑️  Add comments                                  │  │
│ │     [What to comment: Troubleshooting steps]     │  │
│ │                                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─ Knowledge Sources ────────────────────────────────┐  │
│ │                                                     │  │
│ │ Train your AI Agent with company-specific          │  │
│ │ documents and links for accurate responses.        │  │
│ │                                                     │  │
│ │ [📄 Files module integration here]                │  │
│ │                                                     │  │
│ │ ┌──────────────┐  ┌──────────────┐                │  │
│ │ │ 📄 FAQ.pdf   │  │ 📄 Guide.pdf │                │  │
│ │ │ 2.4 MB       │  │ 1.8 MB       │                │  │
│ │ │ ✓ Trained    │  │ ⏳ Training  │                │  │
│ │ └──────────────┘  └──────────────┘                │  │
│ │                                                     │  │
│ │ [+ Upload Document]  [+ Add Website Link]         │  │
│ │                                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Seções:**

#### **A. Configuration**
- **Emoji Picker**: Escolher emoji para o agente
- **Name**: Nome do agente (único por organização)
- **Instructions**: Textarea grande com:
  - Markdown support
  - Variáveis dinâmicas: `{COMPANY_NAME}`, `{AGENT_NAME}`
  - Link "Learn how to write this" → Modal com dicas
  - Contador de caracteres (max: 4000)

#### **B. Actions**
Cada ação tem:
- **Toggle (checkbox)**: Habilita/desabilita
- **Guidelines (textarea)**: Instruções específicas para quando usar

Lista de ações:
1. **Close conversations** - Quando fechar conversas automaticamente
2. **Assign to agent/team** - Quando escalar para humano
3. **Update Lifecycle stages** - Quando mover no ciclo de vida
4. **Update Contact fields** - Quais campos atualizar
5. **Add comments** - O que comentar internamente

#### **C. Knowledge Sources**
- **Integração do módulo Files atual** (`/files`)
- Lista de documentos treinados
- Upload de novos documentos
- Adicionar links de websites
- Status do treinamento (✓ Trained, ⏳ Training, ❌ Failed)

**Componente:**
```
apps/web/modules/ai-agents/
├─ ui/
│  ├─ views/
│  │  └─ ai-agent-configure-view.tsx
│  └─ components/
│     ├─ configuration-section.tsx
│     ├─ actions-section.tsx
│     ├─ knowledge-sources-section.tsx
│     ├─ emoji-picker.tsx
│     └─ action-toggle.tsx
```

---

## 📦 Templates (Hardcoded)

### **Arquivo: `/packages/backend/convex/system/ai/templates.ts`**

```typescript
import { SUPPORT_AGENT_PROMPT } from "./constants";

export const AI_AGENT_TEMPLATES = {
  support: {
    name: "Support Agent",
    emoji: "🎧",
    instructions: SUPPORT_AGENT_PROMPT, // ← Prompt atual em produção!
    description: "Handle customer support tickets and provide instant help with common issues.",
    templateType: "support" as const,
  },

  sales: {
    name: "Sales Agent",
    emoji: "💼",
    instructions: `# Sales Assistant

## Identity & Purpose
You are a sales assistant for the organization.
Your role is to qualify leads, answer product questions, and move prospects through the sales pipeline.

## IMPORTANT: Language Detection
**ALWAYS respond in the SAME language as the customer's message.**

## Available Tools
1. **searchTool** → search knowledge base for product information
2. **escalateConversationTool** → connect with sales team for demos
3. **resolveConversationTool** → mark conversation as complete

## Conversation Flow
1. Qualify leads by asking key questions
2. Answer product questions using knowledge base
3. Book demos or schedule calls
4. Move qualified leads to sales team

## Style & Tone
* Consultative and knowledgeable
* Enthusiastic about products
* Professional yet friendly
* Focus on value, not just features`,
    description: "Qualify leads, answer product questions, and book demos automatically.",
    templateType: "sales" as const,
  },

  receptionist: {
    name: "Receptionist",
    emoji: "📞",
    instructions: `# Receptionist Assistant

## Identity & Purpose
You are a friendly receptionist for the organization.
Your role is to warmly greet visitors and route them to the appropriate team.

## IMPORTANT: Language Detection
**ALWAYS respond in the SAME language as the customer's message.**

## Available Tools
1. **searchTool** → search for information to help route
2. **escalateConversationTool** → transfer to appropriate team
3. **resolveConversationTool** → close simple inquiries

## Conversation Flow
1. Greet visitors warmly
2. Understand their inquiry
3. Collect basic information
4. Route to appropriate team or answer simple questions

## Style & Tone
* Professional and welcoming
* Efficient yet friendly
* Clear communication`,
    description: "Perfect for greeting visitors and routing conversations to the right team.",
    templateType: "receptionist" as const,
  },
};

export type TemplateType = keyof typeof AI_AGENT_TEMPLATES;

export const getTemplates = () => {
  return Object.values(AI_AGENT_TEMPLATES);
};

export const getTemplate = (type: TemplateType) => {
  return AI_AGENT_TEMPLATES[type];
};
```

---

## ⚙️ Funções Backend (Convex)

### **AI Agents** (`/packages/backend/convex/system/aiAgents.ts`)
```typescript
// Queries
- list(orgId) → Lista todos os agentes da organização
- getOne(agentId) → Detalhes de um agente específico
- getFirstActive(orgId) → Primeiro agente ativo (fallback)
- getStats(agentId) → Estatísticas (conversas, taxa de resolução)

// Mutations
- create(orgId, data) → Criar novo agente
- update(agentId, data) → Atualizar agente existente
- delete(agentId) → Excluir agente
- toggleActive(agentId) → Ativar/desativar agente

// Templates (queries para listar templates disponíveis)
- getTemplates() → Lista templates hardcoded disponíveis
- createFromTemplate(orgId, templateType) → Criar agente a partir de template
```

### **Files** (Atualizar - `/packages/backend/convex/system/files.ts`)
```typescript
// Adicionar suporte a agentId
- listByAgent(agentId) → Listar arquivos de um agente
- assignToAgent(fileId, agentId) → Vincular arquivo a agente
```

### **Conversations** (Atualizar - `/packages/backend/convex/system/conversations.ts`)
```typescript
// Adicionar lógica de agente
- assignAgent(conversationId, agentId) → Atribuir agente à conversa
- getAgentStats(agentId) → Estatísticas do agente
```

---

## 🔄 Integração com Sistema Existente

### **1. Sidebar (Atualizar)**
```typescript
// apps/web/modules/dashboard/ui/components/sidebar.tsx

Adicionar novo item:
{
  name: "AI Agents",
  href: "/ai-agents",
  icon: BotIcon, // lucide-react
}

Files:
❌ REMOVER da sidebar principal
✅ Integrado dentro de AI Agents > Knowledge Sources
```

### **2. Migração do supportAgent.ts**

**ANTES (hardcoded):**
```typescript
// convex/system/ai/agents/supportAgent.ts
export const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  instructions: SUPPORT_AGENT_PROMPT, // ← hardcoded
});
```

**DEPOIS (dinâmico):**
```typescript
// convex/system/ai/agents/agentFactory.ts
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "../../../_generated/api";

export const createAgentInstance = (instructions: string) => {
  return new Agent(components.agent, {
    chat: openai.chat("gpt-4o-mini"),
    instructions, // ← vem do banco de dados
  });
};

// Manter supportAgent para compatibilidade temporária
export const supportAgent = createAgentInstance(SUPPORT_AGENT_PROMPT);
```

### **3. Conversa (Atualizar)**

**Ao criar nova conversa:**
```typescript
// Buscar primeiro agente ativo da organização
const agent = await ctx.runQuery(
  internal.system.aiAgents.getFirstActive,
  { organizationId }
);

if (!agent) {
  // Não tem agente configurado
  throw new Error("No AI agent configured. Please create one in Settings > AI Agents");
}

// Criar instância do agente com instructions do banco
const agentInstance = createAgentInstance(agent.instructions);

// Criar conversa vinculada ao agente
await createConversation({
  ...conversationData,
  agentId: agent._id, // ← Rastreia qual agente atendeu
});
```

**Durante conversa:**
```typescript
// public/messages.ts ou similar

// Buscar agente da conversa
const conversation = await getConversation(conversationId);
const agent = await getAIAgent(conversation.agentId);

// Criar instância com instructions personalizadas
const agentInstance = createAgentInstance(agent.instructions);

// Tools continuam funcionando normalmente!
await agentInstance.run(ctx, {
  threadId: conversation.threadId,
  message: userMessage,
});
```

### **4. Migração de Organizações Existentes**

**Script de migração:**
```typescript
// convex/migrations/001_create_default_agents.ts

export const migrateOrganizations = internalMutation({
  handler: async (ctx) => {
    // Buscar todas as organizações existentes
    const subscriptions = await ctx.db.query("subscriptions").collect();

    for (const sub of subscriptions) {
      const orgId = sub.organizationId;

      // Verificar se já tem agente
      const existingAgents = await ctx.db
        .query("aiAgents")
        .withIndex("by_organization_id", q => q.eq("organizationId", orgId))
        .collect();

      if (existingAgents.length === 0) {
        // Criar agente Support Agent (template padrão)
        await ctx.db.insert("aiAgents", {
          organizationId: orgId,
          name: "Support Agent",
          emoji: "🎧",
          instructions: SUPPORT_AGENT_PROMPT, // ← Prompt que já estava em uso
          templateType: "support",
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        console.log(`✅ Created default agent for org ${orgId}`);
      }
    }
  },
});
```

**Para executar migração:**
```bash
# No dashboard do Convex ou via CLI
npx convex run migrations:migrateOrganizations
```

---

## 🎨 Componentes UI Necessários

### **Novos Componentes**
```
apps/web/modules/ai-agents/ui/components/
├─ agent-card.tsx              → Card na lista de agentes
├─ template-card.tsx           → Card de template
├─ emoji-picker.tsx            → Seletor de emoji
├─ configuration-section.tsx   → Seção de configuração
├─ actions-section.tsx         → Seção de ações
├─ action-toggle.tsx           → Toggle individual de ação
├─ knowledge-sources-section.tsx → Seção de knowledge (integra Files)
└─ instructions-editor.tsx     → Editor de instruções com dicas
```

### **Componentes Reutilizados**
```
apps/web/modules/files/
└─ [Todo o módulo será integrado em knowledge-sources-section.tsx]
```

---

## 🌍 Traduções (i18n)

### **Adicionar em `messages/pt-BR.json` e `messages/en.json`**
```json
{
  "aiAgents": {
    "title": "AI Agents",
    "description": "Configure AI agents to automate conversations",
    "createNew": "Create New Agent",
    "templates": {
      "title": "Choose an AI Agent Template",
      "receptionist": {
        "name": "Receptionist",
        "description": "Perfect for greeting visitors and routing conversations"
      },
      "sales": {
        "name": "Sales Agent",
        "description": "Qualify leads and book demos automatically"
      },
      "support": {
        "name": "Support Agent",
        "description": "Handle support tickets and provide instant help"
      },
      "scratch": {
        "name": "Create from Scratch",
        "description": "Start with a blank template"
      }
    },
    "configure": {
      "configuration": "Configuration",
      "emoji": "Emoji",
      "name": "Name",
      "instructions": "Instructions",
      "instructionsHelp": "Learn how to write effective instructions",
      "actions": "Actions",
      "actionsDescription": "Assign actions the AI Agent can take",
      "knowledgeSources": "Knowledge Sources",
      "knowledgeDescription": "Train your AI Agent with documents"
    },
    "actions": {
      "closeConversations": "Close conversations",
      "assignToAgentOrTeam": "Assign to agent or team",
      "updateLifecycleStages": "Update Lifecycle stages",
      "updateContactFields": "Update Contact fields",
      "addComments": "Add comments"
    }
  }
}
```

---

## 🚀 Ordem de Implementação

### **Fase 1: Backend (Schema + Funções)**
1. ✅ Criar schema `aiAgents`
2. ✅ Atualizar schema `files` (adicionar `agentId`)
3. ✅ Atualizar schema `conversations` (adicionar `agentId`)
4. ✅ Criar funções CRUD de `aiAgents`
5. ✅ Criar templates pré-configurados
6. ✅ Atualizar lógica de `files` para suportar agentes

### **Fase 2: Páginas e Navegação**
7. ✅ Criar página lista de agentes (`/ai-agents`)
8. ✅ Criar página de templates (`/ai-agents/new/templates`)
9. ✅ Criar página de configuração (`/ai-agents/new/configure`)
10. ✅ Atualizar sidebar (adicionar AI Agents, remover Files)

### **Fase 3: Componentes**
11. ✅ Criar componentes de listagem (agent-card, stats)
12. ✅ Criar componentes de templates
13. ✅ Criar componentes de configuração (emoji picker, actions, etc)
14. ✅ Integrar módulo Files em knowledge-sources-section

### **Fase 4: Integração com IA**
15. ✅ Atualizar lógica de conversas para usar agente configurado
16. ✅ Implementar execução de actions baseado em configuração
17. ✅ Integrar knowledge sources no RAG

### **Fase 5: Traduções e Testes**
18. ✅ Adicionar traduções pt-BR e en
19. ✅ Testar fluxo completo
20. ✅ Testar integração com conversas existentes

---

## 📝 Notas Importantes

### **1. Migração do Módulo Files**
- ❌ NÃO deletar o módulo Files
- ✅ Mover para dentro de Knowledge Sources (dentro de AI Agents)
- ✅ Adicionar campo `agentId` para vincular files a agentes
- ✅ Manter toda funcionalidade de RAG existente

### **2. Compatibilidade com Sistema Atual**
- ✅ Agente atual (`SUPPORT_AGENT_PROMPT`) vira Template #1
- ✅ Migração automática para orgs existentes (cria agente Support Agent)
- ✅ Novas orgs: usuário cria manualmente
- ✅ Tools existentes (`searchTool`, `escalateConversationTool`, `resolveConversationTool`) continuam funcionando

### **3. Prompts: Editável vs Hardcoded**
- ✅ **Editável:** `instructions` (prompt principal do agente)
- ❌ **Hardcoded:** `SEARCH_INTERPRETER_PROMPT` (lógica interna do RAG)
- ❌ **Hardcoded:** `OPERATOR_MESSAGE_ENHANCEMENT_PROMPT` (feature de UX)

### **4. Diferença: Respond.io vs Echo IA**
- **Respond.io:** Focus em automação e routing (toggles de actions)
- **Echo IA:** Focus em customização do prompt principal (mais flexível)
- **Echo IA:** Integração nativa com RAG (knowledge sources)
- **Echo IA:** Sistema agnóstico (suporte, vendas, recepção, custom)

### **5. Próximos Passos (Futuro)**
- [ ] Analytics de performance por agente (taxa de resolução, escalações)
- [ ] Suporte a múltiplos agentes por organização (escolher por canal/horário)
- [ ] Histórico de versões do prompt (rollback)
- [ ] Testes A/B entre diferentes prompts
- [ ] Marketplace de templates da comunidade
- [ ] Fine-tuning de modelos específicos por agente

---

## 📊 Resumo Visual: ANTES vs DEPOIS

### **Sistema Atual (ANTES)**
```
┌─────────────────────────────────┐
│ supportAgent.ts (hardcoded)     │
│ ├─ SUPPORT_AGENT_PROMPT         │
│ └─ Tools: search, escalate,     │
│    resolve                       │
└─────────────────────────────────┘
         ↓ Todas conversas usam
┌─────────────────────────────────┐
│ Conversations                    │
│ └─ status: unresolved/escalated │
└─────────────────────────────────┘
```

### **Sistema Novo (DEPOIS)**
```
┌─────────────────────────────────┐
│ Templates (hardcoded)            │
│ ├─ Support Agent Template        │ ← SUPPORT_AGENT_PROMPT vira template
│ ├─ Sales Agent Template          │
│ └─ Receptionist Template         │
└─────────────────────────────────┘
         ↓ Usuário escolhe
┌─────────────────────────────────┐
│ aiAgents (banco de dados)        │
│ ├─ Support Agent (org A)         │
│ ├─ Sales Agent (org A)           │
│ ├─ Custom Agent (org B)          │
│ └─ instructions editável         │
└─────────────────────────────────┘
         ↓ Conversas vinculadas
┌─────────────────────────────────┐
│ Conversations                    │
│ ├─ agentId (qual agente usou)   │
│ └─ status: unresolved/escalated │
└─────────────────────────────────┘
```

---

## ✅ Checklist de Aprovação

### **Estrutura Geral**
- [x] Templates = modelos hardcoded (não salvos no banco)
- [x] Agente atual vira Template #1 "Support Agent"
- [x] Apenas prompt principal (`instructions`) é editável
- [x] Prompts auxiliares (RAG, enhancement) permanecem hardcoded
- [x] Sistema 100% agnóstico

### **Schema & Backend**
- [x] Tabela `aiAgents` simplificada (name, emoji, instructions, templateType)
- [x] Campo `agentId` adicionado em `conversations` e `files`
- [x] Templates hardcoded em `/system/ai/templates.ts`
- [x] Factory pattern para criar instâncias dinâmicas

### **UI & Navegação**
- [x] Rota `/ai-agents` → Lista de agentes
- [x] Rota `/ai-agents/new/templates` → Escolher template
- [x] Rota `/ai-agents/[id]/edit` → Configurar agente
- [x] Files integrado em Knowledge Sources

### **Migração**
- [x] Script para criar agente padrão em orgs existentes
- [x] Compatibilidade com código atual mantida
- [x] Tools existentes continuam funcionando

**Documento aprovado e pronto para implementação!** ✅ 🚀
