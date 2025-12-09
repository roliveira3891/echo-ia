# Meta Setup - Quick Reference

Resumo rápido do que fazer no Meta.

---

## 1️⃣ Criar App

```
https://developers.facebook.com
→ Meus Apps
→ Criar Aplicativo
→ Selecionar "Negócios"
→ Nome: "Echo IA"
```

---

## 2️⃣ Adicionar WhatsApp

```
Dashboard do App
→ Meus Produtos
→ WhatsApp: [Configurar]
→ Completar wizard
```

---

## 3️⃣ Copiar Credenciais

```
Configurações → Básico
```

| Campo | Onde Encontrar | Variável de Env |
|-------|---|---|
| **App ID** | Credenciais da Aplicação | `META_APP_ID` |
| **App Secret** | Credenciais da Aplicação | `META_APP_SECRET` |

---

## 4️⃣ Configurar OAuth

```
Configurações → Básico
```

Adicionar URIs de Redirecionamento:
- Dev: `http://localhost:3001/webhooks/whatsapp/callback`
- Prod: `https://seu-dominio.com/webhooks/whatsapp/callback`

---

## 5️⃣ Configurar Webhook

```
WhatsApp → Configuração → Webhooks → [Editar]
```

| Campo | Valor |
|-------|-------|
| **URL de Callback** | `http://localhost:3001/webhooks/whatsapp` |
| **Token de Verificação** | Gere um token aleatório (min 20 chars) |

Guarde o token → `META_WEBHOOK_VERIFY_TOKEN`

### Selecionar Eventos

```
☑ messages
☑ message_status
```

---

## 6️⃣ Conectar WhatsApp Business Account

```
WhatsApp → Primeiros Passos → Conectar Conta
→ Autorizar
→ Selecionar Número de Telefone
```

---

## 7️⃣ Gerar Token Permanente

```
WhatsApp → API Setup
→ Geração de Token Permanente → [Gerar]
```

Guarde: `META_ACCESS_TOKEN` (para produção)

---

## 8️⃣ Testar

### Teste Webhook

```bash
curl -X GET "http://localhost:3001/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Esperado: `test123`

### Teste Envio

```bash
curl -X POST "https://graph.instagram.com/v18.0/PHONE_NUMBER_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "Teste"
    }
  }'
```

Esperado: JSON com `message_id`

### Teste OAuth

```
Dashboard → Integrations
→ Clique "Connect WhatsApp"
→ Autorize no Meta
→ Volte pra app (deve mostrar "Connected")
```

---

## Environment Variables

```env
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_REDIRECT_URI=http://localhost:3001/webhooks/whatsapp/callback
META_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio
APP_URL=http://localhost:3001
```

---

## Valores a Guardar

| O Quê | Onde Encontrar | Por Quê |
|-------|---|---|
| **App ID** | Meta → Configurações → Básico | Identificar seu app |
| **App Secret** | Meta → Configurações → Básico | Autenticar OAuth |
| **Webhook Token** | Meta → Configurações → Webhooks | Validar webhooks |
| **Phone Number ID** | Meta → API Setup (ao conectar) | Enviar mensagens |
| **WABA ID** | Meta → API Setup | Identificar conta |
| **Access Token** | Meta → API Setup (permanente) | Autenticar chamadas API |
| **Número de Telefone** | Meta → API Setup | Saber qual número está conectado |

---

## Checklist

```
Meta Setup:
□ App criado
□ WhatsApp adicionado
□ App ID e Secret copiados
□ OAuth URIs configuradas
□ Webhook URL configurada
□ Webhook Token gerado
□ Eventos webhook habilitados
□ WhatsApp Business Account conectado
□ Token permanente gerado

Seu Código:
□ .env.local criado com variáveis
□ Backend rodando
□ Teste webhook OK
□ Teste envio OK
□ Teste OAuth OK
□ Conta aparece conectada
```

---

## Links Diretos

| Link | O Quê |
|------|-------|
| https://developers.facebook.com | Meta Developers Dashboard |
| https://www.whatsapp.com/business | WhatsApp Business |
| https://developers.facebook.com/docs/whatsapp/ | Documentação WhatsApp |

---

**Próxima etapa:** Ver `META_SETUP_GUIDE.md` para detalhes completos com screenshots.
