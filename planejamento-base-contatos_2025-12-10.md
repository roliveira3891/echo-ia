# Planejamento: Base de Contatos com Ciclo de Vida Agnóstico
**Data:** 2025-12-10

---

## 🎯 Objetivo

Criar um sistema agnóstico de gerenciamento de contatos que funcione para **VENDAS, SUPORTE, E-COMMERCE** e qualquer outro tipo de negócio.

**Inspiração:** respond.io (ciclos como "New Lead", "Hot Lead", "Payment", "Customer")

---

## 📊 Categorias Fixas (Sistema)

As categorias são **fixas e não editáveis** pelo cliente. A IA usa essas categorias para tomar decisões independente dos nomes personalizados que o cliente criar.

```typescript
export const LIFECYCLE_CATEGORIES = {
  NEW: "new",           // 🆕 Novo (contato iniciou interação)
  ACTIVE: "active",     // 🔥 Ativo (em conversa/processo)
  PENDING: "pending",   // ⏳ Pendente (aguardando algo)
  RESOLVED: "resolved", // ✅ Resolvido (objetivo alcançado)
  ARCHIVED: "archived", // 💤 Arquivado (finalizado/inativo)
} as const;
```

### Por Que Categorias Fixas?

A IA precisa das categorias para:
1. **Saber qual tom usar** (qualificação vs suporte vs venda)
2. **Decidir próximas ações** (enviar proposta, escalar, etc)
3. **Acionar automações** (emails, notificações, webhooks)
4. **Medir eficiência** (taxa de conversão NEW→RESOLVED)

---

## 🎨 Como Funciona

### O Cliente Personaliza os Nomes

- Cliente cria "Hot Lead" → seleciona categoria `ACTIVE`
- Cliente cria "Payment" → seleciona categoria `PENDING`
- Cliente cria "Customer" → seleciona categoria `RESOLVED`

### A IA Enxerga as Categorias

- "Hot Lead" → IA entende como `ACTIVE`
- "Payment" → IA entende como `PENDING`
- "Cliente VIP" → IA entende como `RESOLVED`

---

## 🔄 Status da Conversa vs Lifecycle do Contato

**⚠️ IMPORTANTE:** O sistema já possui `conversations.status` em produção. **NÃO MEXER!**

### Diferença Entre os Dois Sistemas

São **DUAS COISAS DIFERENTES** que se complementam:

#### **1. Status da Conversa** (JÁ EXISTE - `conversations.status`)
```typescript
conversations: defineTable({
  status: v.union(
    v.literal("unresolved"),  // Não Resolvido
    v.literal("escalated"),   // Escalado
    v.literal("resolved")     // Resolvido
  ),
})
```

- **Sobre o quê?** → Status de **UMA conversa específica**
- **Quem muda?** → IA ou atendente **durante o atendimento**
- **Escopo:** → Micro (uma conversa isolada)
- **Quando?** → Durante cada interação/ticket

#### **2. Lifecycle do Contato** (NOVO - `contactSessions.lifecycleStageId`)
```typescript
contactSessions: defineTable({
  lifecycleStageId: v.id("lifecycleStages"), // NOVO
})
```

- **Sobre o quê?** → Estado do **contato no ciclo de vida geral**
- **Quem muda?** → IA ou sistema **baseado no histórico completo**
- **Escopo:** → Macro (o contato como um todo)
- **Quando?** → Com base na jornada completa do contato

### Como Funcionam Juntos

**Exemplo: Suporte**

```
João Silva (Contato)
├─ Lifecycle: ACTIVE → "Cliente Ativo" ✅ (nível do contato)
│
└─ Conversas:
   ├─ Conversa #1 (ontem): status = "resolved" ✅
   ├─ Conversa #2 (hoje): status = "unresolved" ⏳ ← IA atendendo agora
   └─ Conversa #3 (semana passada): status = "resolved" ✅
```

**Exemplo: Vendas**

```
Maria Santos (Contato)
├─ Lifecycle: PENDING → "Proposta Enviada" ⏳ (nível do contato)
│
└─ Conversas:
   ├─ Conversa #1: status = "resolved" ✅ (IA qualificou)
   ├─ Conversa #2: status = "resolved" ✅ (IA enviou proposta)
   └─ Conversa #3: status = "unresolved" ⏳ (Maria perguntando sobre prazo)
```

### Como a IA Usa os Dois

**Status da Conversa (Tático):**
```
Durante atendimento:
- Início da conversa: status = "unresolved"
- IA não consegue resolver: status = "escalated"
- IA resolve a questão: status = "resolved"
```

**Lifecycle do Contato (Estratégico):**
```
Análise do histórico:
- Primeiro contato → lifecycle = NEW
- Está engajando → lifecycle = ACTIVE
- Aguardando algo → lifecycle = PENDING
- Objetivo alcançado → lifecycle = RESOLVED
- Sem atividade há dias → lifecycle = ARCHIVED
```

### Exemplo Prático Completo

```
João (Cliente VIP) entra em contato com problema:

┌─────────────────────────────────────────────────┐
│ CONTATO: João Silva                             │
│ Lifecycle: RESOLVED → "Cliente Ativo" ✅       │
│ Tags: VIP, Premium                              │
├─────────────────────────────────────────────────┤
│ CONVERSA ATUAL (#4):                            │
│ Status: "unresolved" ⏳                         │
│                                                  │
│ IA vê:                                          │
│ - É um cliente ativo (lifecycle RESOLVED)       │
│ - Tem tag VIP → priorizar atendimento           │
│ - Conversa atual ainda não foi resolvida        │
│ - Histórico: 3 conversas anteriores resolvidas  │
│                                                  │
│ IA decide:                                      │
│ - Tom empático e prioritário                    │
│ - Resposta rápida (é VIP)                       │
│ - Oferecer ajuda proativa                       │
└─────────────────────────────────────────────────┘
```

### ✅ Conclusão

- ❌ **NÃO mudamos nada** do `conversations.status` existente
- ✅ **Lifecycle** é complementar, dá contexto maior
- ✅ IA usa **ambos** para tomar decisões melhores
- ✅ Status da conversa = tático (agora)
- ✅ Lifecycle = estratégico (jornada completa)

---

## 📋 Templates de Ciclo de Vida

Para facilitar a configuração, o sistema oferece **templates prontos**:

### 1. **Genérico** (Padrão)
```
🆕 NEW       → Novo
🔥 ACTIVE    → Em Andamento
⏳ PENDING   → Aguardando
✅ RESOLVED  → Concluído
💤 ARCHIVED  → Arquivado
```

### 2. **Suporte / Help Desk**
```
🆕 NEW       → Novo Ticket
🔥 ACTIVE    → Em Atendimento, Investigando
⏳ PENDING   → Aguardando Cliente, Aguardando Validação
✅ RESOLVED  → Problema Resolvido
💤 ARCHIVED  → Ticket Fechado
```

### 3. **Vendas / Sales**
```
🆕 NEW       → New Lead
🔥 ACTIVE    → Qualificado, Demo Agendada
⏳ PENDING   → Proposta Enviada, Negociação
✅ RESOLVED  → Cliente Fechado
💤 ARCHIVED  → Lead Perdido, Não Qualificado
```

### 4. **E-commerce**
```
🆕 NEW       → Visitante
🔥 ACTIVE    → Navegando, Carrinho Ativo
⏳ PENDING   → Checkout Iniciado, Aguardando Pagamento
✅ RESOLVED  → Compra Finalizada
💤 ARCHIVED  → Carrinho Abandonado
```

---

## 🔄 Fluxo de Onboarding (Opção 3 - Híbrida)

### **Ao criar organização:**
1. Sistema aplica automaticamente o template **Genérico**
2. Cliente já pode usar o sistema imediatamente
3. IA já tem categorias para trabalhar

### **Primeira vez em Settings > Lifecycle:**
```
┌──────────────────────────────────────────────────┐
│ 💡 Personalize seu Ciclo de Vida                │
│                                                  │
│ Você está usando o template Genérico.          │
│ Quer trocar para um modelo mais adequado?      │
│                                                  │
│ ⚠️ Esta escolha é permanente!                  │
│                                                  │
│     [Ver Templates]    [Continuar Genérico]    │
└──────────────────────────────────────────────────┘
```

### **Regras de Template:**
1. ✅ Template genérico aplicado automaticamente ao criar org
2. ✅ **UMA VEZ** pode trocar de template (na primeira vez que acessa Settings)
3. ❌ Depois de escolher, **NÃO pode mais trocar template** (evita contatos órfãos)
4. ✅ Sempre pode editar/adicionar/remover estágios manualmente

### **Por Que Template NÃO Pode Ser Trocado?**

```
❌ CENÁRIO PROBLEMÁTICO:

1. Cliente aplica template "Vendas"
   - Cria estágio "New Lead" (id: abc123)

2. Cliente tem 500 contatos com lifecycleStageId = "abc123"

3. Cliente troca para template "Suporte"
   - Sistema deleta estágios de "Vendas"
   - Cria novos estágios de "Suporte"

4. 💥 500 contatos ficam ÓRFÃOS com ID inválido!
```

**Solução:** Template é permanente após escolha. Cliente pode apenas editar manualmente.

---

## 🗄️ Schema do Banco de Dados

### **Tabela: tags**
```typescript
tags: defineTable({
  organizationId: v.string(),
  name: v.string(),              // "VIP", "Urgente", "Follow-up"
  color: v.string(),              // "#FF5733"
  description: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_organization_id", ["organizationId"])
```

### **Tabela: contactTags** (Relacionamento N:N)
```typescript
contactTags: defineTable({
  contactSessionId: v.id("contactSessions"),
  tagId: v.id("tags"),
  assignedAt: v.number(),
  assignedBy: v.optional(v.string()), // userId
})
  .index("by_contact", ["contactSessionId"])
  .index("by_tag", ["tagId"])
  .index("by_contact_and_tag", ["contactSessionId", "tagId"])
```

### **Tabela: lifecycleStages**
```typescript
lifecycleStages: defineTable({
  organizationId: v.string(),
  category: v.union(
    v.literal("new"),
    v.literal("active"),
    v.literal("pending"),
    v.literal("resolved"),
    v.literal("archived")
  ),
  name: v.string(),              // Nome customizado pelo cliente
  order: v.number(),              // Ordem dentro da categoria
  color: v.string(),              // Cor do badge
  isDefault: v.boolean(),         // Estágio padrão para novos contatos
  description: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_organization_id", ["organizationId"])
  .index("by_category", ["organizationId", "category", "order"])
```

### **Atualização: contactSessions**
```typescript
contactSessions: defineTable({
  // ... campos existentes (não mudar!) ...

  // NOVOS CAMPOS:
  lifecycleStageId: v.optional(v.id("lifecycleStages")),
  customFields: v.optional(v.any()), // JSON flexível
  lastActivityAt: v.optional(v.number()),
  createdAt: v.number(),
})
```

---

## ⚙️ Funções Backend (Convex)

### **Templates** (`/packages/backend/convex/system/lifecycleTemplates.ts`)
- `applyTemplate(orgId, templateType)` - Aplica template (deleta estágios antigos)
- `getAvailableTemplates()` - Lista templates disponíveis
- `hasLifecycleStages(orgId)` - Verifica se já tem estágios (bloqueia troca de template)

### **Lifecycle Stages** (`/packages/backend/convex/system/lifecycleStages.ts`)
- `list(orgId)` - Lista estágios agrupados por categoria
- `create(orgId, data)` - Cria novo estágio
- `update(stageId, data)` - Atualiza estágio
- `reorder(stageId, newOrder)` - Reordena dentro da categoria
- `delete(stageId)` - Exclui estágio (move contatos para estágio padrão)

### **Tags** (`/packages/backend/convex/system/tags.ts`)
- `list(orgId)` - Lista todas as tags
- `create(orgId, data)` - Cria tag
- `update(tagId, data)` - Atualiza tag
- `delete(tagId)` - Exclui tag (remove de todos os contatos)

### **Contacts** (`/packages/backend/convex/system/contacts.ts`)
- `list(orgId, filters)` - Lista contatos com paginação e filtros
  - Por tags (múltiplas)
  - Por lifecycle stage
  - Por canal (widget, whatsapp, etc.)
  - Por data de criação
  - Busca por nome/email
- `getOne(contactId)` - Detalhes do contato (com tags e lifecycle)
- `addTags(contactId, tagIds[])` - Adiciona tags
- `removeTags(contactId, tagIds[])` - Remove tags
- `updateLifecycle(contactId, stageId)` - Atualiza estágio do ciclo de vida

---

## 🎨 Interface do Usuário

### **Página: Settings > Lifecycle**

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Ciclo de Vida                           [+ Novo]    │
├──────────────────────────────────────────────────────┤
│ 🆕 NEW (Novo)                                       │
│   ☰ Novo Ticket                 [Editar] [Excluir]  │
│   ☰ Novo Lead                   [Editar] [Excluir]  │
│                                                       │
│ 🔥 ACTIVE (Ativo)                                   │
│   ☰ Em Atendimento              [Editar] [Excluir]  │
│   ☰ Negociação                  [Editar] [Excluir]  │
│                                                       │
│ ⏳ PENDING (Pendente)                               │
│   ☰ Aguardando Cliente          [Editar] [Excluir]  │
│   ☰ Proposta Enviada            [Editar] [Excluir]  │
│                                                       │
│ ✅ RESOLVED (Resolvido)                             │
│   ☰ Problema Resolvido          [Editar] [Excluir]  │
│   ☰ Venda Fechada               [Editar] [Excluir]  │
│                                                       │
│ 💤 ARCHIVED (Arquivado)                             │
│   ☰ Ticket Fechado              [Editar] [Excluir]  │
│   ☰ Lead Perdido                [Editar] [Excluir]  │
└──────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Lista estágios agrupados por categoria fixa
- Drag & drop para reordenar dentro da mesma categoria
- CRUD de estágios (criar, editar, excluir)
- Marcar estágio como padrão (⭐)
- Banner de sugestão de templates (apenas na primeira visita)

### **Página: Settings > Tags**

**Layout:**
```
┌─────────────────────────────────────────┐
│ Tags                            [+ Nova]│
│ Organize seus contatos com etiquetas   │
├─────────────────────────────────────────┤
│ 🔵 Cliente VIP         [Editar] [Excluir]│
│ 🔴 Urgente            [Editar] [Excluir]│
│ 🟢 Follow-up          [Editar] [Excluir]│
└─────────────────────────────────────────┘
```

**Funcionalidades:**
- Listagem de todas as tags
- Modal para criar/editar tag (nome, cor, descrição)
- Color picker para escolher cor
- Confirmação antes de excluir

### **Página: Contatos**

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Contatos                                      [+ Novo]   │
│                                                           │
│ [Buscar...] [📋 Tags ▼] [🔄 Lifecycle ▼] [📱 Canal ▼]  │
├──────────────────────────────────────────────────────────┤
│ Nome          Email           Canal    Lifecycle  Tags   │
│ João Silva    joao@mail.com   Widget   Cliente   🔵🟢   │
│ Maria Santos  maria@mail.com  WhatsApp Lead      🔴     │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Tabela com paginação
- Filtros por:
  - Tags (multi-select)
  - Lifecycle stage
  - Canal de origem (widget, whatsapp, instagram, etc.)
  - Data de criação
- Busca por nome/email
- Clique na linha → abre sheet lateral com detalhes
- Ações em massa (adicionar/remover tags, alterar lifecycle)

---

## 🚀 Ordem de Implementação

1. ✅ Schema do banco de dados (tags, contactTags, lifecycleStages)
2. ✅ Atualizar contactSessions
3. ✅ Função para aplicar template genérico ao criar organização
4. ✅ Funções backend: Templates
5. ✅ Funções backend: Lifecycle Stages
6. ✅ Funções backend: Tags
7. ✅ Funções backend: Contacts
8. ✅ UI: Settings > Lifecycle (com seletor de templates)
9. ✅ UI: Settings > Tags
10. ✅ UI: Página Contatos
11. ✅ Traduções i18n (pt-BR e en)

---

## ⚠️ Cuidados Importantes

### 1. **NÃO mudar regras de negócio existentes**
- ❌ NÃO criar tabela `organizations`
- ❌ NÃO mexer em `conversations.status` (já existe em produção!)
- ❌ NÃO mudar estrutura de `contactSessions` atual
- ✅ APENAS adicionar novos campos opcionais
- ✅ Manter compatibilidade com código em produção
- ✅ Lifecycle e Status de conversa são COMPLEMENTARES, não substitutos

### 2. **Template é permanente**
- Cliente pode trocar apenas UMA VEZ (antes de ter contatos)
- Depois, só pode editar manualmente
- Evita contatos órfãos

### 3. **Categorias são fixas**
- Cliente NÃO pode criar novas categorias
- Cliente NÃO pode editar nomes das categorias
- Cliente PODE criar múltiplos estágios dentro de cada categoria

---

## 🤖 Exemplos de Uso da IA

### Suporte
```
João: "Meu produto parou de funcionar"
IA detecta: NEW → move para ACTIVE
IA resolve problema → move para RESOLVED
Se não conseguir → adiciona tag "Escalado" + mantém ACTIVE
```

### Vendas
```
Maria: "Quero saber mais sobre o produto"
IA detecta: NEW
IA qualifica → move para ACTIVE (Hot Lead)
IA envia proposta → move para PENDING (Proposta Enviada)
Pagamento confirmado → move para RESOLVED (Cliente Fechado)
```

A IA sempre usa as **categorias fixas** para tomar decisões, independente dos nomes personalizados.

---

## 📝 Notas Finais

- Sistema agnóstico ✅
- Templates prontos para facilitar ✅
- IA toma decisões baseada em categorias fixas ✅
- Cliente tem flexibilidade para personalizar nomes ✅
- Evita contatos órfãos com template permanente ✅
- Não quebra código em produção ✅
