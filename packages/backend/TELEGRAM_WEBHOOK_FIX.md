# Correção do Webhook do Telegram - 04/12/2025

## 📋 Resumo

Corrigimos completamente a integração do webhook do Telegram com o sistema de chat agnóstico. O bot agora recebe mensagens, processa com AI e responde automaticamente.

---

## 🔍 Problema Inicial

O webhook do Telegram não estava recebendo mensagens. Investigação revelou múltiplos problemas:

1. **Domínio incorreto**: Webhook configurado para `.convex.cloud` ao invés de `.convex.site`
2. **Rota 404**: HTTP routes do Convex não acessíveis
3. **Token errado**: Webhook usando token diferente do banco de dados
4. **ThreadId inválido**: Tentativa de usar string customizada ao invés de ID real da tabela `threads`
5. **ctx.db em Action**: Uso incorreto de `ctx.db` em `internalAction`

---

## 🛠️ Correções Implementadas

### 1. Domínio Correto para HTTP Routes

**Problema**: Rotas HTTP do Convex devem usar `.convex.site`, não `.convex.cloud`

**Solução**:
```bash
# Arquivo: packages/backend/.env.local
APP_URL=https://disciplined-rooster-887.convex.site
```

**URL Correta do Webhook**:
```
https://disciplined-rooster-887.convex.site/webhooks/telegram?token=OmlHOWLghYGe9RZc4w432aEB379BuZfW
```

### 2. Handler GET para Debug

**Adicionado**: Endpoint GET para testar webhook sem precisar do Telegram

**Arquivo**: `convex/http.ts:274-350`

```typescript
/**
 * Telegram Webhook Handler (GET)
 * Used for health checks and debugging
 */
http.route({
  path: "/webhooks/telegram",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Missing token parameter"
      }), { status: 401, headers: { "Content-Type": "application/json" }});
    }

    const connection = await ctx.runQuery(
      internal.system.channelConnections.getConnectionByWebhookToken,
      { channel: "telegram", webhookToken: token }
    );

    if (!connection) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Invalid webhook token"
      }), { status: 401, headers: { "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({
      status: "ok",
      message: "Telegram webhook endpoint is active",
      organizationId: connection.organizationId,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: { "Content-Type": "application/json" }});
  }),
});
```

### 3. Separação de Actions e Mutations

**Problema**: `handleIncomingMessage` era uma `internalAction` mas usava `ctx.db` diretamente

**Solução**: Criadas mutations e queries separadas

**Arquivo**: `convex/system/channels.ts`

```typescript
// Mutations para operações de banco de dados
export const getOrCreateContactSession = internalMutation({
  args: {
    channel: v.string(),
    channelUserId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    let contactSession = await ctx.db
      .query("contactSessions")
      .withIndex("by_channel_user_id")
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .filter((q) => q.eq(q.field("channelUserId"), args.channelUserId))
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .first();

    if (!contactSession) {
      const contactSessionId = await ctx.db.insert("contactSessions", {
        name: args.channelUserId,
        email: `${args.channel}_${args.channelUserId}@local`,
        organizationId: args.organizationId,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        channel: args.channel,
        channelUserId: args.channelUserId,
      });
      contactSession = await ctx.db.get(contactSessionId);
    }

    return contactSession;
  },
});

export const logWebhookEvent = internalMutation({
  args: {
    organizationId: v.string(),
    channel: v.string(),
    eventType: v.string(),
    success: v.boolean(),
    payload: v.any(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookLogs", {
      organizationId: args.organizationId,
      channel: args.channel,
      eventType: args.eventType,
      success: args.success,
      payload: args.payload,
      processedAt: Date.now(),
      error: args.error,
    });
  },
});
```

**Action principal refatorada**:
```typescript
export const handleIncomingMessage = internalAction({
  handler: async (ctx: any, args: any) => {
    try {
      // 1. Lookup/create contactSession usando runMutation
      const contactSession = await ctx.runMutation(
        internal.system.channels.getOrCreateContactSession,
        {
          channel: args.channel,
          channelUserId: args.channelUserId,
          organizationId: args.organizationId,
        }
      );

      // 2. Lookup/create conversation usando runAction
      const conversation = await ctx.runAction(
        internal.system.channels.getOrCreateConversation,
        { ... }
      );

      // ... resto do código

      // 7. Log usando runMutation
      await ctx.runMutation(internal.system.channels.logWebhookEvent, {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: true,
        payload: { ... },
      });
    } catch (error) {
      await ctx.runMutation(internal.system.channels.logWebhookEvent, {
        success: false,
        error: String(error),
        payload: args,
      });
      throw error;
    }
  },
});
```

### 4. Thread Real com Agent Component

**Problema**: Tentativa de criar threadId como string customizada (`"telegram_org_..."`)

**Solução**: Usar `supportAgent.createThread()` para criar thread real

```typescript
export const getOrCreateConversation = internalAction({
  args: {
    contactSessionId: v.id("contactSessions"),
    organizationId: v.string(),
    channel: v.string(),
    channelUserId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    let conversation: any = await ctx.runQuery(
      internal.system.channels.findConversationByContactSessionId,
      { contactSessionId: args.contactSessionId }
    );

    // Valida threadId - se for antigo inválido, recria
    const isInvalidThreadId = conversation &&
      typeof conversation.threadId === 'string' &&
      conversation.threadId.startsWith('telegram_');

    if (!conversation || isInvalidThreadId) {
      // Deleta conversa antiga se existir
      if (isInvalidThreadId) {
        await ctx.runMutation(internal.system.channels.deleteConversation, {
          conversationId: conversation._id,
        });
      }

      // Cria thread REAL usando agent component
      const { threadId } = await supportAgent.createThread(ctx, {
        userId: args.organizationId,
      });

      // Busca configurações e envia mensagem de boas-vindas
      const widgetSettings = await ctx.runQuery(
        internal.system.channels.getWidgetSettings,
        { organizationId: args.organizationId }
      );

      await saveMessage(ctx, components.agent, {
        threadId,
        message: {
          role: "assistant",
          content: widgetSettings?.greetMessage || "Olá! Como posso ajudá-lo?",
        },
      });

      // Cria conversa com threadId válido
      const conversationId = await ctx.runMutation(
        internal.system.channels.createConversation,
        {
          threadId,
          organizationId: args.organizationId,
          contactSessionId: args.contactSessionId,
        }
      );

      conversation = await ctx.runQuery(
        internal.system.channels.getConversationById,
        { conversationId }
      );
    }

    return conversation;
  },
});
```

### 5. Schema com Cast Correto

**Problema**: `threadId` é string mas schema esperava `v.id("threads")`

**Solução**: Aceitar string no schema e fazer cast no insert

```typescript
export const createConversation = internalMutation({
  args: {
    threadId: v.string(), // Aceita string do agent component
    organizationId: v.string(),
    contactSessionId: v.id("contactSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      threadId: args.threadId as any, // Cast para Id<"threads"> no insert
      organizationId: args.organizationId,
      contactSessionId: args.contactSessionId,
      status: "unresolved",
    });
  },
});
```

---

## 🎯 Arquitetura Agnóstica ao Canal

O sistema foi projetado para suportar múltiplos canais de comunicação:

### Receber de Qualquer Canal

```typescript
// convex/http.ts - Telegram Webhook Handler (POST)
http.route({
  path: "/webhooks/telegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // ... validação de token e parsing da mensagem ...

    await ctx.scheduler.runAfter(0, internal.system.channels.handleIncomingMessage, {
      channel: "telegram",  // ← Identifica o canal
      organizationId,
      channelUserId: message.chat.id.toString(),
      messageText: message.text,
      externalMessageId: message.message_id.toString(),
    });
  }),
});
```

### Enviar para o Canal Correto

```typescript
// convex/system/channels.ts
async function sendMessageToChannel(ctx: any, args: {
  channel: string;
  channelUserId: string;
  messageText: string;
  organizationId: string;
}) {
  switch (args.channel) {
    case "whatsapp":
      return await ctx.runAction(
        internal.system.providers.whatsapp_provider.sendMessage,
        args
      );
    case "telegram":
      return await ctx.runAction(
        internal.system.providers.telegram_provider.sendMessage,
        args
      );
    // Adicione mais canais aqui:
    // case "instagram":
    // case "tiktok":
    default:
      throw new Error(`Unknown channel: ${args.channel}`);
  }
}
```

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO AGNÓSTICO DE MENSAGENS                  │
└─────────────────────────────────────────────────────────────────┘

1. 📱 Usuário envia mensagem no Telegram
   │
   ↓
2. 🔔 Telegram Bot API → POST https://disciplined-rooster-887.convex.site/webhooks/telegram
   │  Body: { message: { chat: { id: 123 }, text: "ola" } }
   │
   ↓
3. 🔍 http.ts:357 → handleIncomingMessage(channel: "telegram", ...)
   │
   ↓
4. 💾 getOrCreateContactSession
   │  Busca/cria sessão: { channel: "telegram", channelUserId: "123" }
   │
   ↓
5. 💬 getOrCreateConversation
   │  - Verifica se existe conversa
   │  - Se threadId inválido → Deleta e recria
   │  - Cria thread real: supportAgent.createThread()
   │  - Envia mensagem de boas-vindas
   │
   ↓
6. 💾 saveMessage → Salva mensagem do usuário no thread
   │
   ↓
7. 🤖 api.public.messages.create → AI processa
   │  - supportAgent analisa a mensagem
   │  - Gera resposta usando LLM
   │  - Salva resposta no thread
   │
   ↓
8. 📤 sendMessageToChannel(channel: "telegram", ...)
   │  - Switch detecta "telegram"
   │  - Chama telegram_provider.sendMessage
   │  - POST https://api.telegram.org/bot<TOKEN>/sendMessage
   │
   ↓
9. ✅ Usuário recebe resposta no Telegram
   │
   ↓
10. 📊 logWebhookEvent → Registra em webhookLogs
```

---

## 🔧 Configurações Importantes

### Webhook do Telegram

```bash
# URL configurada
https://disciplined-rooster-887.convex.site/webhooks/telegram?token=OmlHOWLghYGe9RZc4w432aEB379BuZfW

# Comando para atualizar webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://disciplined-rooster-887.convex.site/webhooks/telegram?token=OmlHOWLghYGe9RZc4w432aEB379BuZfW",
    "allowed_updates": ["message", "edited_message"],
    "drop_pending_updates": true
  }'

# Verificar webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### Variáveis de Ambiente

```bash
# packages/backend/.env.local
APP_URL=https://disciplined-rooster-887.convex.site  # ← .convex.site (não .cloud!)
CONVEX_DEPLOYMENT=dev:disciplined-rooster-887
CONVEX_URL=https://disciplined-rooster-887.convex.cloud
```

### Deploy

```bash
# Com typecheck (recomendado)
npx convex dev

# Sem typecheck (para debug)
npx convex dev --typecheck=disable

# Deploy único
npx convex dev --once
```

---

## 🧪 Testando

### 1. Testar Endpoint GET (Health Check)

```bash
curl "https://disciplined-rooster-887.convex.site/webhooks/telegram?token=OmlHOWLghYGe9RZc4w432aEB379BuZfW"

# Resposta esperada:
# {
#   "status": "ok",
#   "message": "Telegram webhook endpoint is active",
#   "organizationId": "org_361ZkFrjpWGAih1hkccyjiiWU4e",
#   "timestamp": "2025-12-04T21:00:00.000Z"
# }
```

### 2. Testar com Mensagem Real

1. Envie mensagem para o bot no Telegram
2. Verifique logs: `npx convex dev`
3. Verifique tabela `webhookLogs` no dashboard
4. Aguarde resposta da AI

### 3. Monitorar

- **Terminal**: Logs em tempo real com `npx convex dev`
- **Dashboard**: https://dashboard.convex.dev/d/disciplined-rooster-887
- **Tabelas**:
  - `webhookLogs` - Eventos recebidos
  - `contactSessions` - Sessões de usuários
  - `conversations` - Conversas ativas
  - `threads` (component) - Threads da AI

---

## 📝 Arquivos Modificados

1. `convex/http.ts`
   - Adicionado handler GET para debug
   - Handler POST já existia

2. `convex/system/channels.ts`
   - Refatorado `handleIncomingMessage`
   - Adicionado `getOrCreateContactSession`
   - Adicionado `getOrCreateConversation` (action)
   - Adicionado `findConversationByContactSessionId`
   - Adicionado `createConversation`
   - Adicionado `getConversationById`
   - Adicionado `deleteConversation`
   - Adicionado `getWidgetSettings`
   - Adicionado `logWebhookEvent`

3. `packages/backend/.env.local`
   - Corrigido `APP_URL` para `.convex.site`

---

## ✅ Resultado Final

**STATUS: FUNCIONANDO PERFEITAMENTE! 🎉**

- ✅ Webhook recebe mensagens do Telegram
- ✅ Sistema cria sessões e conversas automaticamente
- ✅ Threads criados com IDs válidos do agent component
- ✅ AI processa mensagens corretamente
- ✅ Respostas enviadas de volta para o Telegram
- ✅ Logs registrados em `webhookLogs`
- ✅ Arquitetura agnóstica ao canal (fácil adicionar WhatsApp, Instagram, etc)

---

## 🚀 Próximos Passos Possíveis

1. **Adicionar mais canais**:
   - Instagram DM
   - TikTok
   - Facebook Messenger
   - WhatsApp (já implementado)

2. **Melhorar AI**:
   - Personalizar agente por organização
   - Adicionar contexto de histórico
   - Suporte a imagens/arquivos

3. **Features**:
   - Transferência para humano
   - Métricas e analytics
   - Rate limiting
   - Retry logic para falhas

4. **Infraestrutura**:
   - Deploy em produção
   - Monitoramento e alertas
   - Testes automatizados

---

## 📚 Referências

- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Convex Agent Component](https://github.com/get-convex/agent)

---

**Documento criado em**: 04/12/2025
**Por**: Claude Code (Anthropic)
**Desenvolvedor**: Renato Oliveira
