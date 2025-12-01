# Echo-IA: Multi-Channel Architecture

## 📋 Overview

Multi-channel chat system where messages from any source (WhatsApp, Instagram, TikTok, etc.) are processed through a unified, channel-agnostic backend. The `contactSessions` table identifies the channel, and the Convex Agent handles the rest.

**Key Principle**: Each provider (Evolution API, Meta Graph, TikTok API) manages their own user session. We only receive and send messages through the same channel they came from.

---

## 🎯 Architecture Principles

1. **Channel Agnostic**: Schema and logic don't care about channel type
2. **Provider Managed**: Each provider (Evolution, Meta, TikTok) manages user sessions
3. **Single Conversation**: Same `threadId` regardless of channel
4. **No Channel-Specific Tables**: All identified in `contactSessions`
5. **Extensible**: Adding new channel = implement one provider file

---

## 📊 Database Schema Changes

### Modified: `contactSessions`

```typescript
export const contactSessions = defineTable({
  name: v.string(),
  email: v.string(),
  organizationId: v.string(),
  expiresAt: v.number(),
  metadata: v.optional(v.object({
    // ... existing fields unchanged
    userAgent: v.optional(v.string()),
    language: v.optional(v.string()),
    languages: v.optional(v.string()),
    platform: v.optional(v.string()),
    vendor: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    viewportSize: v.optional(v.string()),
    timezone: v.optional(v.string()),
    timezoneOffset: v.optional(v.number()),
    cookieEnabled: v.optional(v.boolean()),
    referrer: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
  })),

  // NEW: Identify the channel
  channel: v.string(),          // "widget", "whatsapp", "instagram", "tiktok", etc.

  // NEW: Unique identifier on the channel
  channelUserId: v.string(),    // "+55119999999" (WhatsApp)
                                // "@username" (Instagram)
                                // "user_id_123" (TikTok)
                                // Agnóstico - cada canal define seu próprio
})
  .index("by_organization_id", ["organizationId"])
  .index("by_expires_at", ["expiresAt"])
  .index("by_channel_user_id", ["channel", "channelUserId"]); // NEW - lookup by channel + user ID
```

### New: `webhookLogs` (Optional, for debugging)

```typescript
export const webhookLogs = defineTable({
  organizationId: v.string(),
  channel: v.string(),          // "whatsapp", "instagram", "tiktok", etc.
  eventType: v.string(),        // "message", "status", "qr_code", etc.
  success: v.boolean(),
  error: v.optional(v.string()),
  payload: v.any(),
  processedAt: v.number(),
}).index("by_organization_id", ["organizationId"])
  .index("by_channel", ["channel"]);
```

### Unchanged Tables

- `organizations` (SACRED - core system)
- `users` (SACRED - core system)
- `conversations` (NO CHANGES - works with threadId)
- `subscriptions` (NO CHANGES)
- `widgetSettings` (NO CHANGES)
- `plugins` (NO CHANGES)
- `files` (NO CHANGES)

---

## 🔄 Message Flow (Channel Agnostic)

```
Provider (WhatsApp/Instagram/TikTok/etc)
         ↓
    Webhook: POST /webhooks/{channel}
         ↓
    validateChannelWebhook (provider-specific)
         ↓
    extractChannelData (maps to agnóstic format)
         ↓
system/channels.ts:handleIncomingMessage
    ├─ 1. Lookup/create contactSession ({channel, channelUserId})
    ├─ 2. Lookup/create conversation
    ├─ 3. Save user message to Convex Agent (thread)
    ├─ 4. Call public/messages.create (AI processes)
    ├─ 5. Get AI response from thread
    ├─ 6. Send response via same channel
    └─ 7. Log webhook event (optional)
         ↓
Provider (sends back to user via their channel)
```

---

## 📁 Folder Structure

```
packages/backend/convex/

├── schema.ts                          ← MODIFY: add 2 fields to contactSessions
│
├── system/
│   ├── ai/                            ← NO CHANGES
│   │   ├── agents/
│   │   │   └── supportAgent.ts
│   │   ├── tools/
│   │   │   ├── search.ts
│   │   │   ├── escalateConversation.ts
│   │   │   └── resolveConversation.ts
│   │   ├── rag.ts
│   │   └── constants.ts
│   │
│   ├── channels.ts (NEW)              ← Main handler for all channels
│   │
│   └── providers/ (NEW)               ← One file per provider/channel
│       ├── whatsapp.ts                ← Evolution API
│       ├── instagram.ts               ← Meta Graph API
│       ├── tiktok.ts                  ← TikTok API
│       └── ... (add new as needed)
│
├── public/
│   ├── messages.ts                    ← NO CHANGES
│   ├── conversations.ts               ← NO CHANGES
│   └── contactSessions.ts             ← NO CHANGES
│
├── private/
│   ├── messages.ts                    ← NO CHANGES
│   ├── conversations.ts               ← NO CHANGES
│   └── ... (others unchanged)
│
└── http.ts                            ← MODIFY: add /webhooks/:channel route
```

---

## 💻 Core Implementation

### 1. Main Channel Handler: `system/channels.ts`

```typescript
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { supportAgent } from "./ai/agents/supportAgent";
import { saveMessage } from "@convex-dev/agent";
import { components } from "../_generated/api";

export const handleIncomingMessage = action({
  args: {
    channel: v.string(),                    // "whatsapp", "instagram", "tiktok", etc
    organizationId: v.string(),
    channelUserId: v.string(),              // Agnóstico: "+55119999999", "@user", etc
    messageText: v.string(),
    externalMessageId: v.optional(v.string()), // ID do provider (para rastreamento)
  },
  handler: async (ctx, args) => {
    try {
      // 1. Lookup/create contactSession (agnóstico)
      let contactSession = await ctx.db
        .query("contactSessions")
        .withIndex("by_channel_user_id")
        .filter(q => q.eq(q.field("channel"), args.channel))
        .filter(q => q.eq(q.field("channelUserId"), args.channelUserId))
        .filter(q => q.eq(q.field("organizationId"), args.organizationId))
        .first();

      if (!contactSession) {
        const contactSessionId = await ctx.db.insert("contactSessions", {
          name: args.channelUserId,               // Nome é o identificador do canal
          email: `${args.channel}_${args.channelUserId}@local`,  // Email dummy
          organizationId: args.organizationId,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,  // 30 dias
          channel: args.channel,
          channelUserId: args.channelUserId,
        });
        contactSession = await ctx.db.get(contactSessionId);
      }

      // 2. Lookup/create conversation (agnóstico)
      let conversation = await ctx.db
        .query("conversations")
        .withIndex("by_contact_session_id")
        .filter(q => q.eq(q.field("contactSessionId"), contactSession!._id))
        .first();

      if (!conversation) {
        const threadId = `${args.channel}_${args.organizationId}_${Date.now()}`;
        const conversationId = await ctx.db.insert("conversations", {
          threadId,
          organizationId: args.organizationId,
          contactSessionId: contactSession!._id,
          status: "unresolved",
        });
        conversation = await ctx.db.get(conversationId);

        // Mensagem de boas-vindas
        const widgetSettings = await ctx.db
          .query("widgetSettings")
          .withIndex("by_organization_id")
          .filter(q => q.eq(q.field("organizationId"), args.organizationId))
          .first();

        await saveMessage(ctx, components.agent, {
          threadId,
          message: {
            role: "assistant",
            content: widgetSettings?.greetMessage || "Olá! Como posso ajudá-lo?",
          },
        });
      }

      // 3. Save user message to Convex Agent
      await saveMessage(ctx, components.agent, {
        threadId: conversation!.threadId,
        message: {
          role: "user",
          content: args.messageText,
        },
      });

      // 4. Call public/messages.create (IA processa)
      await ctx.runAction(api.public.messages.create, {
        threadId: conversation!.threadId,
        prompt: args.messageText,
        contactSessionId: contactSession!._id,
      });

      // 5. Fetch AI response (última mensagem do thread)
      const messages = await supportAgent.listMessages(ctx, {
        threadId: conversation!.threadId,
        paginationOpts: { numItems: 1, cursor: null },
      });

      const aiResponse = messages.page[0];

      // 6. Send response via the same channel
      if (aiResponse?.content) {
        await sendMessageToChannel(ctx, {
          channel: args.channel,
          channelUserId: args.channelUserId,
          messageText: aiResponse.content,
          organizationId: args.organizationId,
        });
      }

      // 7. Log webhook event (optional)
      await ctx.db.insert("webhookLogs", {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: true,
        payload: { channelUserId: args.channelUserId },
        processedAt: Date.now(),
      });

    } catch (error) {
      // Log de erro
      await ctx.db.insert("webhookLogs", {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: false,
        error: String(error),
        payload: args,
        processedAt: Date.now(),
      });
      throw error;
    }
  },
});

// Helper agnóstico para enviar
async function sendMessageToChannel(
  ctx: any,
  args: {
    channel: string;
    channelUserId: string;
    messageText: string;
    organizationId: string;
  }
) {
  switch (args.channel) {
    case "whatsapp":
      return await ctx.runAction(api.system.providers.whatsapp.sendMessage, args);
    case "instagram":
      return await ctx.runAction(api.system.providers.instagram.sendMessage, args);
    case "tiktok":
      return await ctx.runAction(api.system.providers.tiktok.sendMessage, args);
    // ... adiciona novos canais conforme necessário
    default:
      throw new Error(`Unknown channel: ${args.channel}`);
  }
}
```

### 2. HTTP Webhook Router: `http.ts` (Add this route)

```typescript
export const channelWebhook = httpRouter.route({
  path: "/webhooks/:channel",  // /webhooks/whatsapp, /webhooks/instagram, etc
  method: "POST",
  handler: async (ctx) => {
    const channel = ctx.req.url.split("/").pop();
    const body = await ctx.text();
    const data = JSON.parse(body);

    // Cada provider valida sua própria signature/token
    const isValid = await validateChannelWebhook(channel, data, ctx);
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Extrai dados agnósticos (cada canal mapeia do seu formato)
    const extracted = extractChannelData(channel, data);

    try {
      await ctx.runAction(api.system.channels.handleIncomingMessage, {
        channel,
        organizationId: extracted.organizationId,
        channelUserId: extracted.channelUserId,
        messageText: extracted.messageText,
        externalMessageId: extracted.externalMessageId,
      });

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error(`[${channel}] Webhook error:`, error);
      return new Response("Error", { status: 500 });
    }
  }
});

// Helper: Valida assinatura/token por canal
async function validateChannelWebhook(channel: string, data: any, ctx: any): Promise<boolean> {
  switch (channel) {
    case "whatsapp":
      // Valida signature da Evolution API
      return validateEvolutionSignature(data, process.env.EVOLUTION_API_KEY!);
    case "instagram":
      // Valida token da Meta
      return data.token === process.env.INSTAGRAM_WEBHOOK_TOKEN;
    case "tiktok":
      // Valida signature da TikTok
      return validateTikTokSignature(data, process.env.TIKTOK_API_KEY!);
    default:
      return false;
  }
}

// Helper: Extrai dados agnósticos de cada formato de provider
function extractChannelData(channel: string, data: any): {
  organizationId: string;
  channelUserId: string;
  messageText: string;
  externalMessageId?: string;
} {
  switch (channel) {
    case "whatsapp":
      // Evolution API format
      return {
        organizationId: data.organizationId, // precisa estar no webhook
        channelUserId: extractPhoneFromJid(data.data.key.remoteJid), // +55119999999
        messageText: data.data.message.text,
        externalMessageId: data.data.key.id,
      };
    case "instagram":
      // Meta Graph API format
      return {
        organizationId: data.organizationId, // precisa estar no webhook
        channelUserId: data.sender.id, // @username ou ID
        messageText: data.message.text,
        externalMessageId: data.message.mid,
      };
    case "tiktok":
      // TikTok API format
      return {
        organizationId: data.organizationId, // precisa estar no webhook
        channelUserId: data.from_user_id,
        messageText: data.content,
        externalMessageId: data.message_id,
      };
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}
```

### 3. Provider Example: WhatsApp `system/providers/whatsapp.ts`

```typescript
import { action } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Send message via WhatsApp through Evolution API
 *
 * Note: Evolution API manages the user's WhatsApp session.
 * The user connects their own WhatsApp account in Evolution,
 * and we only send messages.
 */
export const sendMessage = action({
  args: {
    channel: v.literal("whatsapp"),
    channelUserId: v.string(),  // +55119999999
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${process.env.EVOLUTION_API_URL}/message/sendText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: args.channelUserId.replace(/\+/, ""), // "5511999999999"
          text: args.messageText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`);
    }

    return { success: true };
  },
});
```

### 4. Provider Example: Instagram `system/providers/instagram.ts`

```typescript
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

/**
 * Send message via Instagram through Meta Graph API
 *
 * Note: Meta Graph API manages the user's Instagram session.
 * The user connects their Instagram account via OAuth,
 * and we store the accessToken in secrets.
 */
export const sendMessage = action({
  args: {
    channel: v.literal("instagram"),
    channelUserId: v.string(),  // @username ou user_id
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Retrieve Instagram access token from secrets
    const accessToken = await ctx.runQuery(
      internal.system.secrets.getInstagramToken,
      { organizationId: args.organizationId }
    );

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${args.channelUserId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          message: args.messageText,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    return { success: true };
  },
});
```

---

## 🚀 Phase 1: Implementation Roadmap

### Step 1: Database Schema
- [ ] Add `channel` field to `contactSessions` (v.string())
- [ ] Add `channelUserId` field to `contactSessions` (v.string())
- [ ] Add `.index("by_channel_user_id", ["channel", "channelUserId"])` to `contactSessions`
- [ ] Create new `webhookLogs` table
- [ ] Test: Can create contactSession with channel info

### Step 2: Core Handler
- [ ] Create `system/channels.ts` with `handleIncomingMessage` action
- [ ] Test: Manual call with mock data

### Step 3: WhatsApp Provider
- [ ] Create `system/providers/whatsapp.ts` with `sendMessage` action
- [ ] Implement `validateEvolutionSignature` helper
- [ ] Implement `extractPhoneFromJid` helper

### Step 4: HTTP Webhook
- [ ] Modify `http.ts` to add `/webhooks/:channel` route
- [ ] Implement `validateChannelWebhook` function
- [ ] Implement `extractChannelData` function
- [ ] Test: Use Postman to send mock webhook

### Step 5: Integration Test
- [ ] Test full flow: webhook → handleIncomingMessage → AI response → sendMessage
- [ ] Verify contactSession is created
- [ ] Verify conversation is created
- [ ] Verify messages are in Convex Agent thread
- [ ] Verify response is sent back

---

## 🎯 Phase 2: Frontend Integration (Optional, for Phase 1)

- [ ] Add WhatsApp card to `/[locale]/integrations`
- [ ] Create modal to display setup instructions
- [ ] Show organization's webhook URL for user to configure in Evolution API
- [ ] No QR code handling - user manages that in Evolution API directly

---

## 📝 Environment Variables Needed

```env
# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://api.evolution.example.com
EVOLUTION_API_KEY=your_evolution_api_key

# Instagram (Meta Graph)
INSTAGRAM_WEBHOOK_TOKEN=your_webhook_token
INSTAGRAM_GRAPH_API_URL=https://graph.instagram.com

# TikTok
TIKTOK_API_KEY=your_tiktok_api_key
TIKTOK_API_URL=https://open-api.tiktok.com
```

---

## 🔑 Key Design Decisions

1. **No channel-specific tables** - Everything in `contactSessions` with `channel` + `channelUserId`
2. **Provider manages sessions** - Evolution, Meta, TikTok handle authentication
3. **Single action for all channels** - `system/channels.handleIncomingMessage` is agnóstic
4. **Provider-specific files only** - `system/providers/{channel}.ts` handles sending
5. **Reuses existing Convex Agent** - No changes to AI logic
6. **Extensible via switch** - Adding channel = add case in switch statements

---

## ✅ Benefits

- ✅ **Scalable**: Adding 100 channels doesn't change core logic
- ✅ **Simple**: No channel-specific complexity
- ✅ **DRY**: Reuse same conversation/message/AI logic
- ✅ **Testable**: Each provider is isolated
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Provider agnostic**: Your system doesn't manage user sessions

---

## 🔄 Next Steps

1. Review architecture with team
2. Implement Phase 1 backend (schema + channels.ts + whatsapp provider)
3. Test with mock Evolution API webhooks
4. Implement Instagram provider (same pattern)
5. Implement TikTok provider (same pattern)
6. Add frontend integrations panel
7. Deploy and monitor

---

## 📞 Support

For questions during implementation, refer to:
- Convex Agent docs: https://docs.convex.dev/ai
- Evolution API docs: https://doc.evolution-api.com
- Meta Graph API: https://developers.facebook.com/docs/graph-api
- TikTok API: https://developers.tiktok.com
