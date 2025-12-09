# WhatsApp Business Integration for Echo IA

Integração completa de WhatsApp Business usando Meta Embedded Signup.

---

## 🚀 Quick Start

**TL;DR - 4 passos:**

1. Leia `META_SETUP_GUIDE.md` (30 min)
2. Faça setup no Meta (45 min)
3. Adicione `.env.local`
4. Teste! ✅

---

## 📚 Documentação

Comece por aqui:

→ **`WHATSAPP_DOCS_INDEX.md`** - Índice completo

Principais documentos:
- **`META_SETUP_GUIDE.md`** ⭐ - Guia passo-a-passo NO META
- **`META_SETUP_QUICK_REFERENCE.md`** - Resumo rápido
- **`WHATSAPP_FLOW_DIAGRAM.md`** - Diagramas visuais
- **`WHATSAPP_META_ARCHITECTURE.md`** - Design técnico
- **`MULTI_CHANNEL_INTEGRATION.md`** - Arquitetura geral

---

## ✅ Implementado

### Backend
```
✅ Database Schema
   - whatsappAccounts table
   - contactSessions + channel/channelUserId fields
   - webhookLogs table

✅ OAuth Handler
   - system/providers/whatsapp-oauth.ts
   - Fluxo Meta OAuth completo

✅ Message Sending
   - system/providers/whatsapp.ts
   - Via Meta Graph API

✅ Core Handler (Agnóstico)
   - system/channels.ts
   - Funciona com qualquer channel

✅ HTTP Routes
   - POST /webhooks/whatsapp/callback (OAuth)
   - GET /webhooks/whatsapp (verification)
   - POST /webhooks/whatsapp (messages)
```

### Frontend
```
✅ UI Component
   - apps/web/.../whatsapp-card.tsx
   - Status da conexão
   - Botão "Connect WhatsApp"
   - Exibe número de telefone

✅ Integrado
   - Adicionado em /integrations
   - Seção "Channel Integrations"
```

---

## 🔧 Setup Rápido

### 1. Meta Configuration

Siga `META_SETUP_GUIDE.md`:

- Criar app em https://developers.facebook.com
- Adicionar WhatsApp
- Copiar credentials
- Configurar OAuth + Webhook
- Conectar Business Account
- Gerar token permanente

### 2. Environment Variables

Crie `.env.local`:

```env
# Meta OAuth
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_REDIRECT_URI=http://localhost:3001/webhooks/whatsapp/callback

# Webhook
META_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio

# App
APP_URL=http://localhost:3001
```

### 3. Test

```bash
# Webhook test
curl -X GET "http://localhost:3001/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Expected: test123
```

### 4. Use

1. Vá para `/integrations`
2. Clique "Connect WhatsApp"
3. Autorize no Meta
4. Veja conta conectada ✅
5. Envie mensagem no WhatsApp
6. Receba resposta automaticamente

---

## 🎯 Architecture

**Agnóstic by Design**

```
Qualquer canal (WhatsApp, Instagram, TikTok, etc)
         ↓
/webhooks/{channel}
         ↓
system/channels.ts:handleIncomingMessage()
    (AGNÓSTICO - mesma lógica para todos)
         ↓
├─ Cria contactSession (channel + userId)
├─ Cria conversation (threadId)
├─ Salva mensagem em Convex Agent
├─ Processa com AI
└─ sendMessageToChannel()
    └─ Delega pro provider correto
       └─ system/providers/{channel}.ts
```

**Benefícios:**
- ✅ Fácil adicionar novos canais
- ✅ Mesma lógica de AI pra todos
- ✅ Sem duplicação de código
- ✅ Escalável

---

## 📊 Database Schema

### contactSessions (UPDATED)
```
+ channel: string                    // "whatsapp", "instagram", etc
+ channelUserId: string              // "+55119999999"
+ index: by_channel_user_id          // Para lookup rápido
```

### whatsappAccounts (NEW)
```
+ organizationId
+ accessToken                        // Meta token
+ whatsappBusinessAccountId          // WABA ID
+ phoneNumberId                      // Para enviar
+ phoneNumber                        // Display
+ webhookToken                       // Validação
+ isActive
+ connectedAt
+ metaUserId
+ indexes: by_organization_id, by_phone_number_id
```

### webhookLogs (NEW)
```
+ organizationId
+ channel
+ eventType                          // "message", "status", etc
+ success: boolean
+ error: optional
+ payload: any
+ processedAt: timestamp
+ indexes: by_organization_id, by_channel
```

---

## 🔄 User Flow

### Connection
```
Dashboard → [Connect WhatsApp]
  ↓
Meta OAuth Dialog
  ↓
User Login + Authorize
  ↓
Callback: /webhooks/whatsapp/callback?code=X&state=org
  ↓
handleCallback():
  - Exchange code → token
  - Fetch WABA + Phone Number
  - Save to DB
  ↓
Redirect: /integrations?whatsapp=connected
  ↓
UI shows: ✅ Connected (+55119999999)
```

### Message Reception
```
User sends WhatsApp message
  ↓
Meta POST /webhooks/whatsapp
  ↓
handleIncomingMessage():
  1. Lookup/create contactSession
  2. Lookup/create conversation
  3. Save to Convex Agent thread
  4. Call AI (supportAgent)
  ↓
sendMessageToChannel():
  - whatsapp.sendMessage()
  - Meta Graph API
  ↓
User receives response
```

---

## 📦 Files Changed

### New Files
```
packages/backend/convex/system/providers/whatsapp-oauth.ts
packages/backend/convex/system/providers/whatsapp.ts
packages/backend/convex/system/channels.ts
apps/web/modules/integrations/ui/components/whatsapp-card.tsx
```

### Modified Files
```
packages/backend/convex/schema.ts                    (+ fields)
packages/backend/convex/http.ts                     (+ routes)
apps/web/modules/integrations/ui/views/integrations-view.tsx (+ import)
```

### Documentation
```
WHATSAPP_DOCS_INDEX.md
META_SETUP_GUIDE.md ⭐
META_SETUP_QUICK_REFERENCE.md
WHATSAPP_FLOW_DIAGRAM.md
WHATSAPP_META_ARCHITECTURE.md
WHATSAPP_README.md (this file)
```

---

## 🧪 Testing

### Unit Tests
```
# TODO: Write tests for each provider action
```

### Integration Tests
```
# TODO: Test OAuth flow end-to-end
# TODO: Test message flow end-to-end
# TODO: Test webhook validation
```

### Manual Testing
```
✅ Webhook verification
   curl -X GET "http://localhost:3001/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=test123"

✅ Send message
   curl -X POST "https://graph.instagram.com/v18.0/PHONE_ID/messages" \
     -H "Authorization: Bearer TOKEN" \
     -d {...}

✅ OAuth flow
   - Click "Connect WhatsApp"
   - Authorize in Meta
   - See "Connected" ✅

✅ Message reception
   - Send WhatsApp message
   - Receive AI response
```

---

## 🚀 What's Next

After WhatsApp works:

### 1. Instagram
```
Same pattern as WhatsApp:
- system/providers/instagram-oauth.ts
- system/providers/instagram.ts
- apps/web/.../instagram-card.tsx
- Add routes to http.ts
```

### 2. TikTok
```
Token-based (simpler):
- system/providers/tiktok-oauth.ts
- system/providers/tiktok.ts
- apps/web/.../tiktok-card.tsx
```

### 3. Telegram
```
Webhook + token-based:
- system/providers/telegram.ts (no OAuth)
- apps/web/.../telegram-card.tsx
```

---

## 📖 How to Read Docs

**For Setup:** Start with `META_SETUP_GUIDE.md`

**For Understanding:** Read in order:
1. `WHATSAPP_DOCS_INDEX.md` (overview)
2. `MULTI_CHANNEL_INTEGRATION.md` (architecture)
3. `WHATSAPP_META_ARCHITECTURE.md` (technical details)
4. `WHATSAPP_FLOW_DIAGRAM.md` (visual)

**For Quick Reference:** Use `META_SETUP_QUICK_REFERENCE.md`

---

## ✅ Checklist

Setup:
```
□ Read META_SETUP_GUIDE.md
□ Create app on Meta
□ Add WhatsApp product
□ Copy App ID & Secret
□ Configure OAuth URIs
□ Configure Webhook URL
□ Connect Business Account
□ Generate permanent token
```

Code:
```
□ Add .env.local
□ Verify schema changes
□ Verify code files exist
□ npm run dev (backend works)
```

Frontend:
```
□ Go to /integrations
□ Click "Connect WhatsApp"
□ Complete OAuth flow
□ See "✅ Connected"
```

Test:
```
□ Test webhook (cURL)
□ Test OAuth (button)
□ Send message (WhatsApp)
□ Receive response (auto)
```

---

## 🆘 Troubleshooting

**Webhook won't verify:**
- Check URL is correct
- Check token format
- Ensure app is running
- See "Troubleshooting" in `META_SETUP_GUIDE.md`

**OAuth won't work:**
- Verify redirect URI in Meta
- Check env vars
- Clear browser cache
- See "Troubleshooting" in `META_SETUP_GUIDE.md`

**Message won't send:**
- Check token didn't expire
- Verify phone number format
- Check subscription is active
- See "Troubleshooting" in `META_SETUP_GUIDE.md`

---

## 📞 Support

Check these docs:
1. `META_SETUP_GUIDE.md` (most common issues)
2. `WHATSAPP_FLOW_DIAGRAM.md` (understand flow)
3. `WHATSAPP_META_ARCHITECTURE.md` (technical)

---

## 🎉 Done!

You now have:
- ✅ Complete WhatsApp integration
- ✅ OAuth flow with Meta
- ✅ Message sending & receiving
- ✅ AI processing
- ✅ Extensible architecture
- ✅ Comprehensive documentation

Next: Instagram, TikTok, etc. (same pattern)

---

**Start with:** `WHATSAPP_DOCS_INDEX.md` → `META_SETUP_GUIDE.md`

Good luck! 🚀
