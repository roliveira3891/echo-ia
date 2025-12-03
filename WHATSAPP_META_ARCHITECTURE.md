# WhatsApp via Meta Embedded Signup - Architecture

## 📋 Overview

Integração de WhatsApp Business usando **Meta Embedded Signup** (também conhecido como "WhatsApp Embedded Signup").

**Key Points**:
- Usuário faz login via Meta OAuth
- Vincula sua conta WhatsApp Business à sua organização
- Nós armazenamos: Access Token, WhatsApp Business Account ID, Phone Number ID, Webhook Token
- Mensagens chegam via Webhooks da Meta
- Respostas são enviadas via Meta Graph API

---

## 🔄 Connection Flow (Frontend)

```
User clicks "Connect WhatsApp" button
         ↓
Redirect to Meta OAuth endpoint
         ↓
User authenticates with Meta/Facebook
         ↓
Meta redirects to callback URL with authorization code
         ↓
Backend exchanges code for access token
         ↓
Store tokens + account info in database
         ↓
Frontend shows "Connected!" ✅
```

---

## 📊 Database Schema Changes

### New: `whatsappAccounts` Table

```typescript
export const whatsappAccounts = defineTable({
  organizationId: v.string(),

  // Meta OAuth
  accessToken: v.string(),                    // Meta access token (long-lived)
  accessTokenExpiresAt: v.optional(v.number()), // Expiry timestamp

  // WhatsApp Business Info
  whatsappBusinessAccountId: v.string(),      // WABA ID from Meta
  phoneNumberId: v.string(),                  // Phone number object ID
  phoneNumber: v.string(),                    // Actual phone number (+55119999999)

  // Security
  webhookToken: v.string(),                   // For validating incoming webhooks
  webhookSecret: v.optional(v.string()),      // Optional: HMAC secret

  // Status
  isActive: v.boolean(),                      // Is this account currently connected?
  connectedAt: v.number(),                    // When was it connected?

  // Meta metadata (for refresh/validation)
  metaUserId: v.optional(v.string()),         // The Meta user who authorized
  metaBusinessAccountId: v.optional(v.string()), // Meta Business Account ID
})
  .index("by_organization_id", ["organizationId"])
  .index("by_phone_number_id", ["phoneNumberId"]);
```

### Update: `contactSessions` Table

For WhatsApp, `channelUserId` will be the phone number (e.g., "+5511999999999")

```typescript
// Already added in previous migration:
channel: v.optional(v.string()),          // "whatsapp"
channelUserId: v.optional(v.string()),    // "+5511999999999"
```

---

## 🔐 Environment Variables

```env
# Meta OAuth
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URI=https://your-domain.com/api/webhooks/whatsapp/callback

# Webhook (generated per organization)
# WHATSAPP_WEBHOOK_TOKEN=<per-organization, stored in DB>
```

---

## 💻 Implementation Files

### 1. **Frontend: Integration Modal**
`apps/web/modules/integrations/ui/components/whatsapp-card.tsx`

```typescript
// Button that links to Meta OAuth
// Shows connected account info if already linked
// Can disconnect/unlink
```

---

### 2. **Backend: OAuth Handler**
`packages/backend/convex/system/providers/whatsapp-oauth.ts`

```typescript
/**
 * Step 1: Generate OAuth authorization URL
 * User clicks "Connect WhatsApp" → redirects to this URL
 */
export const getAuthorizationUrl = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;
    const scope = "whatsapp_business_messaging,whatsapp_business_account_management";

    const url = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scope);
    url.searchParams.set("state", organizationId); // Store org ID in state

    return { authorizationUrl: url.toString() };
  },
});

/**
 * Step 2: Handle OAuth callback
 * Meta redirects here with authorization code
 */
export const handleCallback = action({
  args: {
    code: v.string(),
    state: v.string(), // organizationId
  },
  handler: async (ctx, args) => {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://graph.instagram.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: process.env.META_REDIRECT_URI!,
        code: args.code,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    // 2. Get WhatsApp Business Account details
    const accountResponse = await fetch(
      `https://graph.instagram.com/v18.0/me/owned_whatsapp_business_accounts?access_token=${tokenData.access_token}`
    );

    const accountData = await accountResponse.json();
    const whatsappAccount = accountData.data[0];

    // 3. Get phone number details
    const phoneResponse = await fetch(
      `https://graph.instagram.com/v18.0/${whatsappAccount.id}/phone_numbers?access_token=${tokenData.access_token}`
    );

    const phoneData = await phoneResponse.json();
    const phoneNumber = phoneData.data[0];

    // 4. Generate unique webhook token for this organization
    const webhookToken = crypto.randomUUID();

    // 5. Store in database
    const existingAccount = await ctx.db
      .query("whatsappAccounts")
      .withIndex("by_organization_id")
      .filter((q) => q.eq(q.field("organizationId"), args.state))
      .first();

    if (existingAccount) {
      // Update existing
      await ctx.db.patch(existingAccount._id, {
        accessToken: tokenData.access_token,
        whatsappBusinessAccountId: whatsappAccount.id,
        phoneNumberId: phoneNumber.id,
        phoneNumber: phoneNumber.display_phone_number,
        webhookToken,
        isActive: true,
        connectedAt: Date.now(),
      });
    } else {
      // Create new
      await ctx.db.insert("whatsappAccounts", {
        organizationId: args.state,
        accessToken: tokenData.access_token,
        whatsappBusinessAccountId: whatsappAccount.id,
        phoneNumberId: phoneNumber.id,
        phoneNumber: phoneNumber.display_phone_number,
        webhookToken,
        isActive: true,
        connectedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
```

---

### 3. **Backend: Message Sending**
`packages/backend/convex/system/providers/whatsapp.ts`

```typescript
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

export const sendMessage = action({
  args: {
    channel: v.literal("whatsapp"),
    channelUserId: v.string(),  // "+5511999999999"
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get WhatsApp account credentials
    const whatsappAccount = await ctx.db
      .query("whatsappAccounts")
      .withIndex("by_organization_id")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .first();

    if (!whatsappAccount || !whatsappAccount.isActive) {
      throw new Error("WhatsApp account not connected for this organization");
    }

    // 2. Send message via Meta Graph API
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${whatsappAccount.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${whatsappAccount.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: args.channelUserId.replace(/\D/g, ""), // Remove special chars
          type: "text",
          text: {
            preview_url: false,
            body: args.messageText,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta Graph API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.messages[0].id };
  },
});
```

---

### 4. **Backend: Webhook Handler**
In `packages/backend/convex/http.ts`, add this route:

```typescript
export const whatsappWebhook = httpRouter.route({
  path: "/webhooks/whatsapp",
  method: "POST",
  handler: async (ctx) => {
    const body = await ctx.text();
    const data = JSON.parse(body);

    // Validate webhook token
    const phoneNumberId = data.entry[0].changes[0].value.metadata.phone_number_id;

    const whatsappAccount = await ctx.db
      .query("whatsappAccounts")
      .withIndex("by_phone_number_id")
      .filter((q) => q.eq(q.field("phoneNumberId"), phoneNumberId))
      .first();

    if (!whatsappAccount) {
      return new Response("Not Found", { status: 404 });
    }

    // Validate webhook token from request
    const token = ctx.req.url.split("?")[1]?.split("=")[1]; // ?hub.verify_token=...
    if (token !== whatsappAccount.webhookToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Handle subscription verification (Meta sends GET request)
    if (ctx.req.method === "GET") {
      const challenge = new URL(ctx.req.url).searchParams.get("hub.challenge");
      return new Response(challenge, { status: 200 });
    }

    // Extract message data
    const message = data.entry[0].changes[0].value.messages?.[0];
    if (!message) {
      return new Response("OK", { status: 200 }); // Status update, ignore
    }

    try {
      await ctx.runAction(api.system.channels.handleIncomingMessage, {
        channel: "whatsapp",
        organizationId: whatsappAccount.organizationId,
        channelUserId: `+${message.from}`, // Meta gives without +
        messageText: message.text.body,
        externalMessageId: message.id,
      });

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[WhatsApp Webhook] Error:", error);
      return new Response("Error", { status: 500 });
    }
  },
});
```

---

## 🚀 Setup Steps

### 1. **Meta App Setup** (One-time)
1. Create app on https://developers.facebook.com
2. Add "WhatsApp" product
3. Get App ID and App Secret
4. Set Callback URL: `https://your-domain.com/api/webhooks/whatsapp/callback`
5. Add webhook subscriptions to WhatsApp product

### 2. **Database Migration**
- Add `whatsappAccounts` table to schema

### 3. **Frontend**
- Add "Connect WhatsApp" button to Integrations page
- Link to OAuth authorization URL

### 4. **Backend**
- Implement OAuth handler + callback
- Implement message sending
- Implement webhook listener

### 5. **Test**
```bash
# Test OAuth flow manually
# Test sending message via API
# Test receiving message via webhook
```

---

## ✅ Advantages of This Approach

- ✅ **No local session management** - Meta handles everything
- ✅ **Long-lived tokens** - Can refresh as needed
- ✅ **Scalable** - One account per organization
- ✅ **Secure** - Webhook tokens prevent replay attacks
- ✅ **Meta-managed** - Phone verification, compliance, etc.

---

## 🔄 Next Steps

1. Add `whatsappAccounts` table to schema
2. Implement OAuth handler
3. Implement message sending
4. Implement webhook listener in http.ts
5. Add frontend integration card
6. Test full flow
