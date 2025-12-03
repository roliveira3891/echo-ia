# WhatsApp Integration - Visual Flow Diagrams

Diagramas visuais mostrando como tudo funciona.

---

## 1️⃣ Setup Flow (O que você faz no Meta)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Criar App na Meta                                    │
│    - Ir para https://developers.facebook.com            │
│    - Meus Apps → Criar Aplicativo                       │
│    - Tipo: Negócios                                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Adicionar WhatsApp                                   │
│    - Meus Produtos → WhatsApp [Configurar]              │
│    - Completar wizard                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Copiar Credenciais                                   │
│    - Configurações → Básico                             │
│    - Copiar: App ID, App Secret                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Configurar OAuth                                     │
│    - Adicionar URIs de Redirecionamento                 │
│    - http://localhost:3001/webhooks/whatsapp/callback   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Configurar Webhook                                   │
│    - URL: http://localhost:3001/webhooks/whatsapp       │
│    - Gerar Token de Verificação                         │
│    - Selecionar eventos (messages, message_status)      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Conectar Business Account                            │
│    - WhatsApp → Primeiros Passos                        │
│    - Conectar Conta → Autorizar                         │
│    - Selecionar número de telefone                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Gerar Token Permanente                               │
│    - WhatsApp → API Setup                               │
│    - Gerar Token de Acesso Permanente                   │
│    - Guardar token (não expira)                         │
└─────────────────────────────────────────────────────────┘
                         ↓
                    ✅ PRONTO!
```

---

## 2️⃣ OAuth Connection Flow (O que usuário faz)

```
USER DASHBOARD
    │
    ├─ Clica "Connect WhatsApp"
    │
    ↓
┌──────────────────────────────────────┐
│ whatsappCard.tsx:handleConnect()      │
│ - Chama getAuthorizationUrl()        │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ system/providers/whatsapp-oauth.ts   │
│ getAuthorizationUrl()                │
│ - Gera URL Meta OAuth                │
│ - Retorna: URL                       │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ window.location.href = authUrl       │
│ Redireciona pro Meta                 │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ META OAUTH DIALOG                    │
│ https://facebook.com/v18.0/dialog/   │
│ oauth?client_id=...&state=org_123    │
│                                      │
│ Usuário: Login + Autorizar           │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ Meta redireciona para:               │
│ /webhooks/whatsapp/callback          │
│ ?code=XXXXX&state=org_123            │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ http.ts:whatsappCallback()           │
│ - Extrai code e state                │
│ - Chama handleCallback()             │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ system/providers/whatsapp-oauth.ts   │
│ handleCallback()                     │
│ 1. Troca code → access_token         │
│ 2. Busca WhatsApp Accounts (WABA)    │
│ 3. Busca Phone Numbers               │
│ 4. Salva em whatsappAccounts DB      │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ Redireciona pra:                     │
│ /org_123/integrations?whatsapp=conc  │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ whatsappCard Query:                  │
│ - Busca whatsappAccount              │
│ - Mostra "✅ Conectado"              │
│ - Exibe número de telefone           │
└──────────────────────────────────────┘
    │
    ↓
            ✅ CONECTADO!
            (e pronto pra receber msgs)
```

---

## 3️⃣ Message Receiving Flow (Cliente envia msg)

```
CLIENTE (WhatsApp)
    │
    ├─ Abre chat com seu número
    │
    ├─ Digita mensagem
    │
    ├─ Envia
    │
    ↓
┌──────────────────────────────────────┐
│ META SERVERS                         │
│ (Processa mensagem WhatsApp)         │
│ (Valida, formata)                    │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ POST /webhooks/whatsapp              │
│ {                                    │
│   entry: [{                          │
│     changes: [{                      │
│       value: {                       │
│         messages: [{                 │
│           from: "5511999999999",     │
│           text: { body: "Olá!" }     │
│         }]                           │
│       }                              │
│     }]                               │
│   }]                                 │
│ }                                    │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ http.ts:whatsappWebhook() [POST]     │
│ - Valida phone_number_id             │
│ - Valida webhook token               │
│ - Extrai message                     │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ system/channels.ts                   │
│ handleIncomingMessage()              │
│ - Cria/busca contactSession          │
│   (channel=whatsapp,                 │
│    channelUserId=+5511999999999)     │
│ - Cria/busca conversation (threadId) │
│ - Salva msg no Convex Agent          │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ public/messages.create()             │
│ - Valida organização                 │
│ - Valida subscription (ativa?)       │
│ - Chama supportAgent.generateText()  │
│   (IA processa mensagem)             │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ OPENAI (supportAgent)                │
│ - Processa com GPT-4o-mini           │
│ - Gera resposta                      │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ Resposta salva no Convex Agent       │
│ thread                               │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ system/channels.ts                   │
│ sendMessageToChannel()               │
│ - Switch: channel = "whatsapp"       │
│ - Chama whatsapp.sendMessage()       │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ system/providers/whatsapp.ts         │
│ sendMessage()                        │
│ - Busca whatsappAccount              │
│ - Prepara payload                    │
│ - POST Meta Graph API                │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ META GRAPH API                       │
│ /v18.0/{phoneNumberId}/messages      │
│ - Processa requisição                │
│ - Envia pro WhatsApp Server          │
└──────────────────────────────────────┘
    │
    ↓
┌──────────────────────────────────────┐
│ WHATSAPP SERVERS                     │
│ - Roteia mensagem                    │
│ - Entrega pro cliente                │
└──────────────────────────────────────┘
    │
    ↓
CLIENTE (WhatsApp)
    │
    ├─ Recebe notificação
    │
    ├─ Abre chat
    │
    ├─ Vê mensagem: "Oi! Como posso ajudar?"
    │
    ↓
            ✅ SUCESSO!
            (Conversa completa)
```

---

## 4️⃣ Architecture Overview (Agnóstica)

```
┌─────────────────────────────────────────────────────────┐
│ PROVIDERS (Extensível)                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────────┐  ┌──────────────────┐             │
│ │ WhatsApp         │  │ Instagram        │             │
│ │ ├─ OAuth         │  │ ├─ OAuth         │             │
│ │ └─ Send Message  │  │ └─ Send Message  │             │
│ └──────────────────┘  └──────────────────┘             │
│                                                         │
│ ┌──────────────────┐  ┌──────────────────┐             │
│ │ TikTok           │  │ Telegram         │             │
│ │ ├─ OAuth         │  │ ├─ Token Auth    │             │
│ │ └─ Send Message  │  │ └─ Send Message  │             │
│ └──────────────────┘  └──────────────────┘             │
│                                                         │
│ (Mesmo padrão para todos)                              │
└─────────────────────────────────────────────────────────┘
                    ↑
                    │ Delega para provider correto
                    │
┌─────────────────────────────────────────────────────────┐
│ CHANNEL HANDLER (Agnóstico)                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ handleIncomingMessage(                                  │
│   channel: "whatsapp" | "instagram" | "tiktok" | ...   │
│   channelUserId: "+55119999999"                         │
│   messageText: "Olá!"                                   │
│   organizationId: "org_123"                             │
│ )                                                       │
│                                                         │
│ 1. Lookup/create contactSession (channel + userId)     │
│ 2. Lookup/create conversation (threadId)               │
│ 3. Save message to Convex Agent                        │
│ 4. Process with AI                                     │
│ 5. Send response via same channel                      │
│                                                         │
│ (Mesmo fluxo para TODOS os canais)                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ CORE SYSTEMS (Shared)                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✓ Convex Agent (thread management)                     │
│ ✓ OpenAI Integration (supportAgent)                    │
│ ✓ Database (conversations, contactSessions)            │
│ ✓ Tools (escalate, resolve, search)                    │
│                                                         │
│ (Shared entre todos os canais)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5️⃣ Database Schema (Agnóstico)

```
┌──────────────────────────┐
│ contactSessions          │
├──────────────────────────┤
│ id                       │
│ organizationId           │
│ name                     │
│ email                    │
│ channel      ← "whatsapp"│
│ channelUserId← "+55119..."
│ expiresAt                │
│ metadata                 │
└──────────────────────────┘
        ↓
        │ (1-to-many)
        │
┌──────────────────────────┐
│ conversations            │
├──────────────────────────┤
│ id                       │
│ threadId  ← Convex Agent│
│ status    ← unresolved  │
│ contactSessionId        │
│ organizationId          │
└──────────────────────────┘
        ↓
        │ (1-to-many)
        │
┌──────────────────────────┐
│ Convex Agent Thread      │
├──────────────────────────┤
│ messages (array)         │
│ ├─ role: "user"         │
│ ├─ content: "Olá!"      │
│ ├─ role: "assistant"    │
│ ├─ content: "Oi!"       │
└──────────────────────────┘

SEPARADO: Provider-Specific Tables
────────────────────────────────────

┌──────────────────────────┐
│ whatsappAccounts         │
├──────────────────────────┤
│ organizationId           │
│ accessToken              │
│ phoneNumberId            │
│ phoneNumber              │
│ webhookToken             │
│ isActive                 │
└──────────────────────────┘

┌──────────────────────────┐
│ instagramAccounts        │
├──────────────────────────┤
│ organizationId           │
│ accessToken              │
│ businessAccountId        │
│ webhookToken             │
│ isActive                 │
└──────────────────────────┘

(Mesmo padrão para outros canais)
```

---

## 6️⃣ Environment Variables (Checklist)

```
┌─────────────────────────────────────────┐
│ .env.local                              │
├─────────────────────────────────────────┤
│                                         │
│ # Meta OAuth                            │
│ META_APP_ID=...                         │
│ META_APP_SECRET=...                     │
│ META_REDIRECT_URI=...                   │
│                                         │
│ # Webhook                               │
│ META_WEBHOOK_VERIFY_TOKEN=...           │
│                                         │
│ # App                                   │
│ APP_URL=...                             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7️⃣ What Happens When...

### ...Usuário clica "Connect WhatsApp"

```
Frontend: onClick Handler
  ↓
getAuthUrl() action
  ↓
window.location = authUrl
  ↓
Meta OAuth Dialog
  ↓
Usuário autoriza
  ↓
Callback endpoint
  ↓
handleCallback() action
  ↓
Troca código → token → accounts
  ↓
Salva em DB
  ↓
Redireciona dashboard
  ↓
Query busca status
  ↓
UI mostra "✅ Conectado"
```

### ...Cliente envia mensagem

```
WhatsApp Client
  ↓
Meta Webhook
  ↓
POST /webhooks/whatsapp
  ↓
handleIncomingMessage()
  ↓
Cria contactSession
  ↓
Cria conversation
  ↓
Convex Agent thread
  ↓
supportAgent.generateText()
  ↓
OpenAI API
  ↓
Resposta gerada
  ↓
sendMessage() via provider
  ↓
Meta Graph API
  ↓
WhatsApp Client recebe
```

---

**Tudo pronto! Agora só precisa fazer o setup no Meta (ver META_SETUP_GUIDE.md)**
