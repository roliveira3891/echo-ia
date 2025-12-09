# 📋 PLANO DE REDESIGN DA UI - Conversas

**Data:** 2025-12-08
**Objetivo:** Replicar exatamente o design do template shadcnuikit.com/dashboard/apps/chat

---

## ✅ O QUE JÁ FOI FEITO HOJE

### 1. **Integração Evolution API - Concluído** ✅
- Adicionado verificação de status ao carregar o card
- Sincronização automática entre Evolution API e banco de dados
- Botões Conectar/Desconectar agora mudam corretamente baseado no status real
- Sistema detecta quando desconecta do celular e atualiza automaticamente

### 2. **Sistema de Ícones de Canal - Concluído** ✅
- Criado `lib/channel-utils.ts` com funções simples
- Substituído bandeiras de países por ícones de canal
- Suporte para: Widget, WhatsApp, Instagram, Telegram, Facebook, TikTok, LinkedIn, Evolution
- Criado SVG do ícone do widget (`/public/channels/widget.svg`)
- Widget agora salva `channel: "widget"` automaticamente

### 3. **Sistema de Foto de Perfil - Concluído** ✅
- Adicionado campo `profilePictureUrl` no schema do `contactSession`
- Avatar principal mostra foto de perfil (quando disponível)
- Badge mostra ícone do canal
- Implementado em `conversations-panel.tsx` e `contact-panel.tsx`

**Arquivos Modificados:**
- `/packages/backend/convex/schema.ts` - Campo `profilePictureUrl` e `channel`
- `/packages/backend/convex/public/contactSessions.ts` - Widget salva canal automaticamente
- `/apps/web/lib/channel-utils.ts` - Funções de ícones
- `/apps/web/modules/dashboard/ui/components/conversations-panel.tsx` - Avatar + badge
- `/apps/web/modules/dashboard/ui/components/contact-panel.tsx` - Avatar + badge
- `/apps/web/public/channels/widget.svg` - Novo ícone

---

## 🎯 PRÓXIMOS PASSOS - REDESIGN UI

### **Referência:** https://shadcnuikit.com/dashboard/apps/chat

### **PRINCÍPIO IMPORTANTE:**
- ✅ Mudar TUDO visual/UI
- ❌ NÃO mexer na lógica de negócio
- ❌ NÃO mudar sistema de status (unresolved/escalated/resolved)

---

## 📐 ESTRUTURA DO NOVO LAYOUT

### Antes (2 colunas):
```
┌─────────────────┬──────────────────────────┐
│  Conversas      │  Mensagens               │
│  (30%)          │  (70%)                   │
└─────────────────┴──────────────────────────┘
```

### Depois (3 colunas):
```
┌─────────────┬──────────────┬──────────┐
│ Conversas   │  Mensagens   │ Detalhes │
│  (25%)      │   (50%)      │  (25%)   │
└─────────────┴──────────────┴──────────┘
```

### Responsividade:
- **Mobile (<768px):** 1 coluna (navegação por stack)
- **Tablet (768-1024px):** 2 colunas (Conversas + Mensagens)
- **Desktop (>1024px):** 3 colunas (Conversas + Mensagens + Detalhes)

---

## 🎨 COMPONENTES A IMPLEMENTAR

### **1. LISTA DE CONVERSAS (Coluna Esquerda)**

```tsx
┌─────────────────────────────┐
│ 🔍 Search...                │  ← Input de busca
├─────────────────────────────┤
│ [All Chats] [Archived]      │  ← Tabs
├─────────────────────────────┤
│ ┌───┐ Johnny Doe            │
│ │ 🟢│ Great! I'll update...  │  ← Card conversa
│ └───┘ 08:42 AM          [8] │  ← Badge contador
├─────────────────────────────┤
│ ┌───┐ Alice Smith           │
│ │   │ Sounds good to me     │
│ └───┘ Yesterday         [5] │
└─────────────────────────────┘
```

**Elementos:**
- [ ] Input de busca com ícone de lupa
- [ ] Tabs "All Chats" e "Archived"
- [ ] Avatar com indicador online (bolinha verde 🟢)
- [ ] Nome do contato (bold)
- [ ] Preview da última mensagem (texto cinza)
- [ ] Timestamp à direita
- [ ] Badge circular com número de não lidas
- [ ] Hover effect
- [ ] Card ativo com fundo diferente

---

### **2. ÁREA DE MENSAGENS (Coluna Central)**

**Header:**
```tsx
┌─────────────────────────────────────────┐
│ ┌───┐ Johnny Doe        🟢 Active now   │
│ │   │ johnny@example.com    [···]       │
└─────────────────────────────────────────┘
```

**Mensagens:**
```tsx
┌─────────────────────────────────────────┐
│         Today                            │  ← Separador
├─────────────────────────────────────────┤
│ ┌────────────────────┐                  │
│ │ Their message      │ 08:42 AM         │
│ └────────────────────┘                  │
│                                          │
│                  ┌────────────────────┐ │
│         08:43 AM │ Your message   ✓✓│ │
│                  └────────────────────┘ │
└─────────────────────────────────────────┘
```

**Input:**
```tsx
┌─────────────────────────────────────────┐
│ [📎] [😊] ┌──────────────────┐ [🎤] [➤] │
│           │ Type a message...│           │
└─────────────────────────────────────────┘
```

**Elementos:**
- [ ] Header: Avatar + Nome + Status online + Menu (···)
- [ ] Separadores de data ("Today", "Yesterday", "Monday")
- [ ] Mensagens esquerda (deles) / direita (suas)
- [ ] Cores: cinza (deles) / azul (suas)
- [ ] Timestamps pequenos
- [ ] Check marks (✓ enviado, ✓✓ lido)
- [ ] Toolbar: Anexo, Emoji, Textarea, Áudio, Enviar

---

### **3. PAINEL DE DETALHES (Coluna Direita)**

```tsx
┌─────────────────────────────┐
│      ┌─────────┐            │
│      │  Avatar │            │  ← Avatar grande
│      └─────────┘            │
│     Johnny Doe              │
│     🟢 Active now           │
├─────────────────────────────┤
│ 📧 johnny@example.com       │
│ 📱 +1 (555) 123-4567        │
│ 🌐 johnnydoe.com            │
├─────────────────────────────┤
│ About                       │
│ "Passionate developer..."   │
├─────────────────────────────┤
│ Shared Media                │
│ ┌───┬───┬───┐              │
│ │img│img│img│              │
│ ├───┼───┼───┤              │
│ │pdf│xls│doc│              │
│ └───┴───┴───┘              │
└─────────────────────────────┘
```

**Elementos:**
- [ ] Avatar grande centralizado
- [ ] Nome + Status online
- [ ] Email, telefone, website
- [ ] Bio/Descrição
- [ ] Links de redes sociais
- [ ] País
- [ ] Grid de mídia compartilhada (3 colunas)

---

## 🎨 CORES E ESTILOS (Template)

```css
/* Cores principais */
--background: hsl(0 0% 100%)           /* Branco */
--foreground: hsl(222.2 84% 4.9%)     /* Texto escuro */
--primary: hsl(221.2 83.2% 53.3%)     /* Azul */
--muted: hsl(210 40% 96.1%)           /* Cinza claro */
--border: hsl(214.3 31.8% 91.4%)      /* Bordas */

/* Mensagens */
--message-user: hsl(221.2 83.2% 53.3%)    /* Azul */
--message-them: hsl(210 40% 96.1%)        /* Cinza */

/* Status */
--online: hsl(142.1 76.2% 36.3%)          /* Verde */
```

---

## 📊 NOVOS CAMPOS DO BANCO (Apenas UI)

```typescript
// Em conversations ou messages:
unreadCount?: number           // Contador visual
isArchived?: boolean           // Para tabs All/Archived
lastReadAt?: number           // Timestamp leitura

// Em contactSessions:
isOnline?: boolean            // Status online
lastSeenAt?: number          // Última vez online

// Em messages:
status?: "sent" | "delivered" | "read"  // Status de leitura
mediaType?: "text" | "image" | "video" | "audio" | "file"
```

---

## 📋 FASES DE IMPLEMENTAÇÃO

### **FASE 1 - Estrutura (Começar por aqui)**
- [ ] Criar layout 3 colunas com `ResizablePanel`
- [ ] Configurar responsividade (breakpoints)
- [ ] Aplicar cores do template
- [ ] Testar em mobile/tablet/desktop

**Arquivos a modificar:**
- `/apps/web/modules/dashboard/ui/layouts/conversations-layout.tsx`

---

### **FASE 2 - Lista de Conversas**
- [ ] Input de busca
- [ ] Tabs (All Chats / Archived)
- [ ] Redesign do card de conversa
- [ ] Badge contador de não lidas
- [ ] Indicador online
- [ ] States (hover, active)

**Arquivos a modificar:**
- `/apps/web/modules/dashboard/ui/components/conversations-panel.tsx`

---

### **FASE 3 - Área de Mensagens**
- [ ] Header completo
- [ ] Separadores de data
- [ ] Redesign das mensagens (bubbles)
- [ ] Timestamps e check marks
- [ ] Toolbar do input

**Arquivos a modificar:**
- `/apps/web/modules/dashboard/ui/views/conversation-id-view.tsx`

---

### **FASE 4 - Painel de Detalhes**
- [ ] Criar 3ª coluna
- [ ] Mover/adaptar `contact-panel.tsx`
- [ ] Grid de mídia compartilhada
- [ ] Layout responsivo

**Arquivos a criar/modificar:**
- Nova coluna em `conversations-layout.tsx`
- Adaptar `/apps/web/modules/dashboard/ui/components/contact-panel.tsx`

---

## ⚠️ O QUE NÃO MEXER

❌ **NÃO** mudar status das conversas (unresolved/escalated/resolved)
❌ **NÃO** mexer no `ConversationStatusButton`
❌ **NÃO** alterar queries/mutations de status
❌ **NÃO** mudar lógica de workflow
❌ **NÃO** modificar sistema de AI Agent

---

## 🚀 ORDEM SUGERIDA DE IMPLEMENTAÇÃO

1. **FASE 1** - Estrutura (mais seguro)
2. **FASE 2** - Lista de Conversas
3. **FASE 3** - Área de Mensagens
4. **FASE 4** - Painel de Detalhes

**Motivo:** Começar pelas mudanças estruturais e ir refinando visualmente

---

## 📁 ESTRUTURA DE ARQUIVOS ATUAL

```
apps/web/
├── app/[locale]/(dashboard)/conversations/
│   ├── layout.tsx (usa ConversationsLayout)
│   ├── page.tsx
│   └── [conversationId]/
│       └── page.tsx (usa ConversationIdView)
├── modules/dashboard/ui/
│   ├── layouts/
│   │   └── conversations-layout.tsx  ← MODIFICAR FASE 1
│   ├── components/
│   │   ├── conversations-panel.tsx   ← MODIFICAR FASE 2
│   │   └── contact-panel.tsx         ← MODIFICAR FASE 4
│   └── views/
│       └── conversation-id-view.tsx  ← MODIFICAR FASE 3
└── lib/
    └── channel-utils.ts ✅ (já criado)

packages/backend/convex/
└── schema.ts ✅ (profilePictureUrl e channel já adicionados)
```

---

## 🔗 REFERÊNCIAS

- **Template:** https://shadcnuikit.com/dashboard/apps/chat
- **Shadcn UI:** https://ui.shadcn.com/
- **Componentes usados:** ResizablePanel, ScrollArea, Avatar, Badge, Button, Input, Tabs

---

## 💡 NOTAS IMPORTANTES

1. **Manter lógica de negócio intacta**
2. **Replicar design exatamente como no template**
3. **Implementar em fases para não quebrar sistema**
4. **Testar responsividade em cada fase**
5. **Código simples e fácil de manter**

---

## 📞 PRÓXIMA SESSÃO

**Começar por:** FASE 1 - Estrutura (Layout 3 colunas)

**Perguntar antes de começar:**
- Confirmar se começa pela FASE 1
- Ver se precisa de ajustes no plano
- Definir prioridades

---

**Status:** 🟡 Planejamento Completo - Pronto para Implementação
