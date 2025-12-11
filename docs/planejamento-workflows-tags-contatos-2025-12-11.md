# Planejamento: Sistema de Workflows, Tags e Contatos Permanentes

**Data:** 2025-12-11
**Versão:** 1.0
**Status:** Aprovado para implementação

---

## 📋 Sumário Executivo

Implementação de um sistema escalável e agnóstico de workflows, tags e contatos permanentes para o Echo IA, mantendo 100% de compatibilidade com o sistema atual em produção.

### Objetivos Principais

1. ✅ **Contatos Permanentes** - Substituir sessions temporárias (24h) por contatos persistentes
2. ✅ **Sistema de Tags** - Permitir categorização flexível de contatos
3. ✅ **Workflows Configuráveis** - Automações customizáveis sem código
4. ✅ **Importação de Dados** - Upload de CSV/Excel com contatos
5. ✅ **Compatibilidade Total** - Não quebrar funcionalidades atuais

---

## 🏗️ Arquitetura do Sistema

### Princípios de Design

1. **Híbrido (Default + Workflows)**
   - Sistema funciona "out of the box" sem configuração
   - Workflows são **opcionais** e complementam/sobrescrevem comportamento default
   - Agente AI continua respondendo automaticamente por padrão

2. **Escalável por Registry**
   - Novos triggers/actions adicionados via código (sem migrations)
   - Strings livres no schema (não enums fixos)
   - Plugin-ready para futuras extensões

3. **Agnóstico de Canal**
   - Suporta múltiplos canais por contato
   - Workflows podem executar em qualquer canal ativo
   - Preferências de canal configuráveis

---

## 📊 Estrutura de Dados

### 1. Contatos Permanentes

```typescript
// Tabela principal de contatos
contacts: defineTable({
  organizationId: v.string(),

  // Dados básicos
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  cpf: v.optional(v.string()),

  // Metadata customizável (para inadimplência, etc.)
  customFields: v.optional(v.any()),
  // Exemplo: { "valor_debito": 1500, "vencimento": "2024-01-15", "status": "inadimplente" }

  // Origem do contato
  source: v.union(
    v.literal("import"),      // Importado via CSV
    v.literal("widget"),      // Criado via chat widget
    v.literal("manual"),      // Cadastro manual
    v.literal("api"),         // Via API externa
  ),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  lastContactedAt: v.optional(v.number()),
})
.index("by_organization_id", ["organizationId"])
.index("by_email", ["email"])
.index("by_phone", ["phone"])
.index("by_cpf", ["cpf"])
```

**Relação com contactSessions:**
- `contactSessions` adiciona campo **opcional** `contactId: v.optional(v.id("contacts"))`
- Sessions antigas sem contactId continuam funcionando
- Sessions novas linkam ao contato permanente
- Migration opcional migra sessions antigas

---

### 2. Canais do Contato

```typescript
// Múltiplos canais por contato
contactChannels: defineTable({
  contactId: v.id("contacts"),
  channelType: v.string(),      // "whatsapp", "telegram", "instagram", "email", "sms"
  channelUserId: v.string(),    // +5511999999, @username, user@email.com
  isActive: v.boolean(),        // Contato bloqueou/desativou?
  isPrimary: v.boolean(),       // Canal preferido?
  metadata: v.optional(v.any()),
  createdAt: v.number(),
})
.index("by_contact", ["contactId"])
.index("by_channel_user", ["channelType", "channelUserId"])
```

**Casos de uso:**
- João tem WhatsApp + Telegram + Email
- Workflow envia por WhatsApp primeiro, se não responder tenta Telegram
- Dashboard mostra todos os canais ativos do contato

---

### 3. Sistema de Tags

```typescript
// Tags da organização
tags: defineTable({
  organizationId: v.string(),
  name: v.string(),              // "Inadimplente", "VIP", "Lead Quente"
  color: v.string(),             // "#FF0000"
  icon: v.optional(v.string()),  // "dollar-sign", "alert-circle"
  description: v.optional(v.string()),
  createdAt: v.number(),
})
.index("by_organization_id", ["organizationId"])
.index("by_name", ["organizationId", "name"])

// Relacionamento N:N (contato pode ter múltiplas tags)
contactTags: defineTable({
  contactId: v.id("contacts"),
  tagId: v.id("tags"),
  addedAt: v.number(),
  addedBy: v.optional(v.string()),  // userId ou "system"
})
.index("by_contact", ["contactId"])
.index("by_tag", ["tagId"])
.index("by_contact_and_tag", ["contactId", "tagId"])
```

**Exemplo:**
- João tem tags: ["Inadimplente", "VIP", "Lead Quente"]
- Maria tem tags: ["Lead Frio", "Inadimplente"]
- Sem limite de tags por contato

---

### 4. Workflows

```typescript
workflows: defineTable({
  organizationId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),

  // Trigger (gatilho) - STRING LIVRE, não enum!
  triggerType: v.string(),      // "tag_added", "contact_created", "message_received", etc.
  triggerConfig: v.any(),       // JSON livre

  // Modo de execução
  executionMode: v.union(
    v.literal("before"),    // Executa ANTES do comportamento default
    v.literal("after"),     // Executa DEPOIS do comportamento default
    v.literal("replace"),   // SUBSTITUI o comportamento default
  ),

  // Actions (ações em sequência) - TIPOS LIVRES, não enums!
  actions: v.array(v.object({
    type: v.string(),           // "send_message", "add_tag", "wait", etc.
    config: v.any(),
    conditions: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    }))),
  })),

  // Prioridade (maior = executa primeiro)
  priority: v.number(),         // 0-100

  // Stats
  executionCount: v.number(),
  lastExecutedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_organization_id", ["organizationId"])
.index("by_trigger_type", ["triggerType", "isActive"])
.index("by_priority", ["priority"])

// Log de execuções
workflowExecutions: defineTable({
  workflowId: v.id("workflows"),
  contactId: v.id("contacts"),
  conversationId: v.optional(v.id("conversations")),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("waiting"),        // Para ações com delay
  ),
  currentActionIndex: v.number(),
  error: v.optional(v.string()),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  logs: v.array(v.object({
    timestamp: v.number(),
    action: v.string(),
    result: v.string(),
  })),
})
.index("by_workflow", ["workflowId"])
.index("by_contact", ["contactId"])
.index("by_status", ["status"])
```

---

## 🔧 Sistema de Registry (Extensibilidade)

### Triggers Disponíveis

```typescript
// system/workflows/registry.ts

export const WORKFLOW_TRIGGERS = {
  tag_added: {
    name: "Tag Adicionada",
    description: "Dispara quando uma tag é adicionada a um contato",
    icon: "tag",
    configSchema: {
      tagId: { type: "id", required: true, label: "Tag" },
    },
  },

  tag_removed: {
    name: "Tag Removida",
    description: "Dispara quando uma tag é removida de um contato",
    icon: "tag-off",
    configSchema: {
      tagId: { type: "id", required: true, label: "Tag" },
    },
  },

  contact_created: {
    name: "Contato Criado",
    description: "Dispara quando um novo contato é criado",
    icon: "user-plus",
    configSchema: {
      source: { type: "string", required: false, label: "Origem" },
    },
  },

  message_received: {
    name: "Mensagem Recebida",
    description: "Dispara quando contato envia mensagem",
    icon: "message-circle",
    configSchema: {
      channelType: { type: "string", required: false, label: "Canal" },
      containsKeyword: { type: "string", required: false, label: "Palavra-chave" },
    },
  },

  conversation_escalated: {
    name: "Conversa Escalada",
    description: "Dispara quando conversa é escalada para humano",
    icon: "user",
    configSchema: {},
  },

  conversation_resolved: {
    name: "Conversa Resolvida",
    description: "Dispara quando conversa é marcada como resolvida",
    icon: "check-circle",
    configSchema: {},
  },

  scheduled: {
    name: "Agendado",
    description: "Dispara em horário/intervalo específico",
    icon: "clock",
    configSchema: {
      cronExpression: { type: "string", required: true, label: "Cron" },
    },
  },

  webhook_received: {
    name: "Webhook Recebido",
    description: "Dispara quando webhook externo é recebido",
    icon: "webhook",
    configSchema: {
      webhookUrl: { type: "string", required: true, label: "URL do Webhook" },
      secret: { type: "string", required: false, label: "Secret" },
    },
  },
} as const;
```

### Actions Disponíveis

```typescript
export const WORKFLOW_ACTIONS = {
  send_message: {
    name: "Enviar Mensagem",
    description: "Envia mensagem via canal escolhido",
    icon: "send",
    configSchema: {
      channelTypes: { type: "array", required: true, label: "Canais" },
      messageTemplate: { type: "text", required: true, label: "Mensagem" },
      preferredChannel: { type: "string", required: false, label: "Canal Preferido" },
    },
  },

  add_tag: {
    name: "Adicionar Tag",
    description: "Adiciona tag ao contato",
    icon: "tag",
    configSchema: {
      tagId: { type: "id", required: true, label: "Tag" },
    },
  },

  remove_tag: {
    name: "Remover Tag",
    description: "Remove tag do contato",
    icon: "tag-off",
    configSchema: {
      tagId: { type: "id", required: true, label: "Tag" },
    },
  },

  wait: {
    name: "Aguardar",
    description: "Pausa execução por período",
    icon: "clock",
    configSchema: {
      duration: { type: "number", required: true, label: "Duração (ms)" },
    },
  },

  escalate_conversation: {
    name: "Escalar para Humano",
    description: "Transfere conversa para operador",
    icon: "user",
    configSchema: {
      reason: { type: "string", required: false, label: "Motivo" },
    },
  },

  resolve_conversation: {
    name: "Resolver Conversa",
    description: "Marca conversa como resolvida",
    icon: "check-circle",
    configSchema: {
      reason: { type: "string", required: false, label: "Motivo" },
    },
  },

  send_webhook: {
    name: "Enviar Webhook",
    description: "Chama URL externa com dados do contato",
    icon: "webhook",
    configSchema: {
      url: { type: "string", required: true, label: "URL" },
      method: { type: "string", required: true, label: "Método HTTP" },
      headers: { type: "object", required: false, label: "Headers" },
      body: { type: "text", required: false, label: "Body Template" },
    },
  },

  update_contact: {
    name: "Atualizar Contato",
    description: "Modifica campos do contato",
    icon: "edit",
    configSchema: {
      fields: { type: "object", required: true, label: "Campos" },
    },
  },

  assign_agent: {
    name: "Atribuir Agente AI",
    description: "Troca o agente AI da conversa",
    icon: "bot",
    configSchema: {
      agentId: { type: "id", required: true, label: "Agente AI" },
    },
  },
} as const;
```

**Vantagem:** Adicionar novo trigger/action = editar apenas `registry.ts`, sem migration!

---

## 🎬 Fluxos de Execução

### Fluxo 1: Cliente SEM Workflows (Default)

```
1. Mensagem WhatsApp chega
   ↓
2. Sistema verifica: Existe workflow "message_received"?
   → NÃO
   ↓
3. ✅ EXECUTA COMPORTAMENTO DEFAULT:
   • Busca AI Agent atribuído ao canal
   • AI Agent processa com GPT-4o-mini
   • Responde automaticamente
   • Sistema continua igual ao atual
```

**Resultado:** Nada muda! Funciona como sempre funcionou.

---

### Fluxo 2: Cliente COM Workflow (Replace)

```
1. Mensagem WhatsApp contém "boleto"
   ↓
2. Sistema verifica: Existe workflow "message_received"?
   → SIM! "Envio de Boleto Automático"
   ↓
3. Workflow tem executionMode = "replace"
   ↓
4. ✅ EXECUTA WORKFLOW (pula AI Agent):
   • Detecta palavra-chave "boleto"
   • Chama API do ERP (webhook)
   • Envia PDF do boleto
   • Adiciona tag "Boleto Enviado"
   • Marca conversa como "resolved"
   ↓
5. AI Agent NÃO é chamado (workflow resolveu tudo)
```

---

### Fluxo 3: Cliente COM Workflow (Before/After)

```
1. Mensagem Telegram chega
   ↓
2. Sistema verifica workflows "message_received"
   → 2 workflows encontrados
   ↓
3. Workflow A (executionMode = "before", priority = 80):
   • Adiciona tag "Lead Telegram"
   • Atualiza customFields.source = "telegram"
   • Envia webhook para CRM externo
   ↓
4. ✅ EXECUTA COMPORTAMENTO DEFAULT:
   • AI Agent responde normalmente
   ↓
5. Workflow B (executionMode = "after", priority = 50):
   • Aguarda 5 minutos
   • Se contato não respondeu, envia follow-up
   • Escala para humano se necessário
```

---

### Fluxo 4: Importação de Inadimplentes (Completo)

```
1. Cliente faz upload de CSV com inadimplentes
   ↓
2. Sistema processa importação:
   • Parse de 100 linhas
   • Valida dados (nome, telefone, CPF, valor)
   • Cria 100 registros em "contacts"
   • source = "import"
   • customFields = { status: "inadimplente", valor_debito: 1500, ... }
   ↓
3. Trigger "contact_created" dispara Workflow A:
   • Verifica customFields.status === "inadimplente"
   • Adiciona tag "Inadimplente"
   ↓
4. Trigger "tag_added" (tag = "Inadimplente") dispara Workflow B:
   • Busca canais ativos do contato
   • Envia mensagem via WhatsApp:
     "Olá {{contact.name}}! Identificamos débito de R$ {{customFields.valor_debito}}..."
   • Adiciona tag "Cobrança Enviada"
   • Cria conversationId
   ↓
5. Contato responde no WhatsApp
   ↓
6. Trigger "message_received" NÃO tem workflow configurado
   → ✅ Comportamento default
   ↓
7. AI Agent responde automaticamente
   ↓
8. Workflow C (executionMode = "after"):
   • Aguarda 24h
   • Se contato não respondeu novamente:
     • Envia mensagem via Telegram
     • Escala para operador humano
     • Adiciona tag "Escalado"
```

---

## 🎯 Caso de Uso: Cobrança de Inadimplentes

### Workflow 1: Auto-tag na Importação

```json
{
  "name": "Auto-tag Inadimplentes",
  "triggerType": "contact_created",
  "triggerConfig": {
    "source": "import"
  },
  "executionMode": "after",
  "priority": 50,
  "actions": [
    {
      "type": "add_tag",
      "config": {
        "tagName": "Inadimplente"
      },
      "conditions": [
        {
          "field": "customFields.status",
          "operator": "equals",
          "value": "inadimplente"
        }
      ]
    }
  ]
}
```

### Workflow 2: Primeira Mensagem (WhatsApp)

```json
{
  "name": "Cobrança Inicial - WhatsApp",
  "triggerType": "tag_added",
  "triggerConfig": {
    "tagName": "Inadimplente"
  },
  "executionMode": "replace",
  "priority": 80,
  "actions": [
    {
      "type": "send_message",
      "config": {
        "channelTypes": ["whatsapp"],
        "messageTemplate": "Olá {{contact.name}}! Identificamos um débito de R$ {{contact.customFields.valor_debito}} com vencimento em {{contact.customFields.vencimento}}. Podemos ajudar a regularizar?",
        "onlyIfChannelActive": true
      }
    },
    {
      "type": "add_tag",
      "config": {
        "tagName": "Cobrança Enviada"
      }
    }
  ]
}
```

### Workflow 3: Follow-up Cascata

```json
{
  "name": "Follow-up Cascata (24h → Telegram → Humano)",
  "triggerType": "tag_added",
  "triggerConfig": {
    "tagName": "Cobrança Enviada"
  },
  "executionMode": "after",
  "priority": 70,
  "actions": [
    {
      "type": "wait",
      "config": {
        "duration": 86400000
      }
    },
    {
      "type": "send_message",
      "config": {
        "channelTypes": ["telegram"],
        "messageTemplate": "{{contact.name}}, ainda não recebemos seu retorno sobre o débito. Prefere negociar pelo Telegram?"
      },
      "conditions": [
        {
          "field": "conversation.lastMessageFrom",
          "operator": "not_equals",
          "value": "contact"
        }
      ]
    },
    {
      "type": "wait",
      "config": {
        "duration": 86400000
      }
    },
    {
      "type": "escalate_conversation",
      "config": {
        "reason": "Inadimplente não respondeu após 48h"
      },
      "conditions": [
        {
          "field": "conversation.lastMessageFrom",
          "operator": "not_equals",
          "value": "contact"
        }
      ]
    },
    {
      "type": "add_tag",
      "config": {
        "tagName": "Escalado - Cobrança"
      }
    }
  ]
}
```

---

## 📅 Plano de Implementação

### FASE 1: Fundação (1 semana)

**Objetivo:** Criar infraestrutura base sem quebrar produção

**Entregas:**
- ✅ Schema de `contacts`, `contactChannels`, `tags`, `contactTags`
- ✅ Schema de `workflows` e `workflowExecutions`
- ✅ Adicionar campo OPCIONAL `contactId` em `contactSessions`
- ✅ CRUD de tags (backend + UI básica)
- ✅ Workflow Engine (executor)
- ✅ Registry de triggers/actions
- ✅ 3 triggers: `tag_added`, `contact_created`, `message_received`
- ✅ 5 actions: `send_message`, `add_tag`, `remove_tag`, `escalate_conversation`, `wait`

**Arquivos a criar:**
```
packages/backend/convex/
├── schema.ts                           # Atualizar com novas tabelas
├── private/tags.ts                     # CRUD de tags
├── private/contacts.ts                 # CRUD de contatos
├── private/workflows.ts                # CRUD de workflows
├── system/workflows/
│   ├── engine.ts                       # Motor de execução
│   ├── registry.ts                     # Registro de tipos
│   ├── triggers.ts                     # Handlers de triggers
│   ├── actions/
│   │   ├── sendMessage.ts
│   │   ├── addTag.ts
│   │   ├── removeTag.ts
│   │   ├── escalateConversation.ts
│   │   └── wait.ts
│   └── conditions.ts                   # Avaliador de condições
├── migrations/
│   └── migrateContactSessions.ts       # Migration opcional

apps/web/modules/
├── settings/ui/views/tags-view.tsx     # UI de gerenciamento de tags
├── workflows/
│   └── ui/views/workflows-list-view.tsx # Lista de workflows (JSON editor)
```

**Garantia de compatibilidade:**
- Todas as tabelas atuais permanecem inalteradas
- `contactSessions` adiciona campo opcional (não quebra)
- Workflows são opcionais (default behavior mantido)
- Migration script roda em background sem downtime

---

### FASE 2: Importação de Contatos (3 dias)

**Objetivo:** Permitir entrada de dados via CSV/Excel

**Entregas:**
- ✅ Upload de arquivos CSV/Excel
- ✅ Parser + validação de dados
- ✅ Mapeamento de colunas
- ✅ Preview antes de importar
- ✅ Bulk insert com tags automáticas
- ✅ Histórico de importações

**Arquivos a criar:**
```
packages/backend/convex/
├── public/contacts.ts                  # Mutation de importação
├── system/contacts/
│   ├── parser.ts                       # Parse CSV/Excel
│   ├── validator.ts                    # Validação de dados
│   └── bulkInsert.ts                   # Insert em lote

apps/web/modules/contacts/
├── ui/views/
│   ├── contacts-list-view.tsx          # Lista de contatos
│   ├── contact-detail-view.tsx         # Detalhe do contato
│   └── import-contacts-view.tsx        # Importação
├── ui/components/
│   ├── upload-dropzone.tsx             # Drag & drop
│   ├── column-mapper.tsx               # Mapear colunas
│   ├── import-preview.tsx              # Preview
│   └── import-history.tsx              # Histórico
```

**Fluxo de importação:**
1. Upload de arquivo (CSV/Excel)
2. Sistema detecta colunas automaticamente
3. Usuário mapeia: Coluna A → nome, Coluna B → telefone, etc.
4. Preview de 10 primeiros registros
5. Confirma importação
6. Processamento em background
7. Notificação quando completo

---

### FASE 3: Workflows UI (1-2 semanas)

**Objetivo:** Interface visual para criar workflows sem JSON

**Entregas:**
- ✅ Editor visual de workflows (canvas drag-and-drop)
- ✅ Biblioteca de templates prontos
- ✅ Logs de execução em tempo real
- ✅ Testes de workflow (dry-run)
- ✅ Analytics (taxa de conversão, sucesso/falha)
- ✅ Documentação inline

**Arquivos a criar:**
```
apps/web/modules/workflows/
├── ui/views/
│   ├── workflow-editor-view.tsx        # Editor visual
│   ├── workflow-executions-view.tsx    # Logs de execução
│   ├── workflow-templates-view.tsx     # Templates prontos
│   └── workflow-analytics-view.tsx     # Métricas
├── ui/components/
│   ├── workflow-canvas.tsx             # Canvas (React Flow)
│   ├── trigger-selector.tsx            # Seletor de trigger
│   ├── action-node.tsx                 # Node de action
│   ├── condition-builder.tsx           # Builder de condições
│   ├── workflow-stats.tsx              # Stats inline
│   └── template-card.tsx               # Card de template

packages/ui/src/components/workflow/    # Componentes reutilizáveis
├── node-base.tsx
├── edge-base.tsx
└── minimap.tsx
```

**Biblioteca React Flow:**
- [React Flow](https://reactflow.dev/) - Recomendado
- Interface tipo Zapier/n8n
- Drag & drop de nodes
- Conexões visuais

**Templates prontos:**
1. Cobrança em Cascata (WhatsApp → Telegram → Humano)
2. Qualificação de Leads
3. Follow-up Pós-Venda (NPS)
4. Reativação de Inativos
5. Distribuição Multicanal
6. Escalação por Palavra-chave

---

## 🛡️ Garantias de Compatibilidade

### Funcionalidades Atuais Preservadas

| Funcionalidade | Status | Estratégia |
|---------------|--------|-----------|
| Chat widget → AI responde | ✅ Mantido | Comportamento default preservado |
| WhatsApp → AI responde | ✅ Mantido | Comportamento default preservado |
| Telegram → AI responde | ✅ Mantido | Comportamento default preservado |
| AI Agents custom | ✅ Mantido | Continuam atribuídos por canal |
| contactSessions temporárias | ✅ Mantido | Campo contactId opcional |
| Webhooks existentes | ✅ Mantido | Sem alterações |
| Escalação manual | ✅ Mantido | Operadores continuam podendo escalar |

### Estratégia de Migration

1. **Adicionar, não remover**
   - Novas tabelas criadas
   - Tabelas antigas mantidas
   - Relação opcional entre elas

2. **Migration em background**
   - Script roda fora de horário de pico
   - Processa sessions antigas gradualmente
   - Não afeta performance

3. **Rollback seguro**
   - Tabelas antigas intactas
   - Pode reverter a qualquer momento
   - Zero downtime

---

## 📊 Métricas de Sucesso

### KPIs Técnicos
- ✅ 100% de uptime durante migration
- ✅ 0 quebras de funcionalidades existentes
- ✅ Tempo de resposta < 200ms para workflows simples
- ✅ Suporte a 100+ workflows simultâneos

### KPIs de Produto
- ✅ Clientes conseguem criar workflow em < 5 minutos
- ✅ Templates reduzem tempo de configuração em 80%
- ✅ Taxa de adoção de workflows > 30% em 3 meses

---

## 🔮 Roadmap Futuro (Pós-MVP)

### Fase 4: Workflows Avançados (Futuro)
- Branches condicionais (IF/ELSE visual)
- Loops (iterar sobre listas)
- Variáveis customizadas
- Sub-workflows (reutilizáveis)

### Fase 5: Integrações (Futuro)
- Zapier/Make.com webhooks
- API pública para workflows
- Marketplace de workflows da comunidade
- Plugin system para custom actions

### Fase 6: Analytics Avançado (Futuro)
- Funil de conversão por workflow
- A/B testing de mensagens
- Heatmap de horários de resposta
- Predição de churn

---

## 📚 Referências Técnicas

### Bibliotecas Necessárias
- **React Flow** - Editor visual de workflows
- **Papa Parse** - Parse CSV
- **XLSX** - Parse Excel
- **Zod** - Validação de schemas

### Inspirações de Design
- Zapier - Simplicidade de uso
- n8n - Editor visual
- Pipedream - Logs detalhados
- ActiveCampaign - Templates prontos

---

## ✅ Checklist de Implementação

### Fase 1: Fundação
- [ ] Atualizar schema.ts com novas tabelas
- [ ] Criar CRUD de tags
- [ ] Criar CRUD de contatos
- [ ] Criar CRUD de workflows
- [ ] Implementar Workflow Engine
- [ ] Criar Registry de triggers/actions
- [ ] Implementar actions básicas (5)
- [ ] Implementar triggers básicos (3)
- [ ] Criar UI de tags
- [ ] Criar lista de workflows (JSON editor)
- [ ] Escrever testes unitários
- [ ] Migration script para contactSessions
- [ ] Documentação técnica

### Fase 2: Importação
- [ ] Parser CSV
- [ ] Parser Excel
- [ ] Validação de dados
- [ ] Mapeamento de colunas
- [ ] Preview de importação
- [ ] Bulk insert otimizado
- [ ] UI de importação
- [ ] Histórico de importações
- [ ] Tratamento de erros
- [ ] Testes de carga (10k+ registros)

### Fase 3: Workflows UI
- [ ] Integrar React Flow
- [ ] Canvas drag-and-drop
- [ ] Seletor de triggers
- [ ] Builder de actions
- [ ] Builder de condições
- [ ] Templates prontos (6)
- [ ] Logs em tempo real
- [ ] Dry-run de workflows
- [ ] Analytics básico
- [ ] Documentação para usuários

---

## 🎓 Glossário

**Contact** - Registro permanente de pessoa/empresa
**ContactSession** - Sessão temporária (24h) de chat
**ContactChannel** - Canal de comunicação (WhatsApp, Telegram, etc.)
**Tag** - Etiqueta/categoria atribuída a contatos
**Workflow** - Automação configurável com trigger + actions
**Trigger** - Evento que inicia um workflow
**Action** - Ação executada pelo workflow
**Execution Mode** - Como workflow se comporta (before/after/replace)
**Registry** - Sistema de registro de triggers/actions extensível
**Custom Fields** - Campos personalizados por organização

---

**Documento aprovado para implementação.**
**Próximo passo:** Iniciar Fase 1 - Fundação