# Meta Setup Guide - WhatsApp Business Integration

Guia completo com screenshots e instruções passo-a-passo para configurar WhatsApp Business no Meta.

---

## 📋 Índice

1. [Criar App na Meta](#criar-app-na-meta)
2. [Adicionar Produto WhatsApp](#adicionar-produto-whatsapp)
3. [Obter Credenciais](#obter-credenciais)
4. [Configurar OAuth](#configurar-oauth)
5. [Configurar Webhooks](#configurar-webhooks)
6. [Setup WhatsApp Business Account](#setup-whatsapp-business-account)
7. [Gerar Token Permanente](#gerar-token-permanente)
8. [Testar Conexão](#testar-conexão)
9. [Environment Variables](#environment-variables)

---

## Criar App na Meta

### Passo 1: Acessar Meta Developers

**Link:** https://developers.facebook.com

1. Faça login com sua conta Facebook/Meta
2. Clique em **"Meus Apps"** no menu superior

```
┌─────────────────────────────────────────────────┐
│ Meta Developers Dashboard                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Meus Apps    Comunidade    Documentação     │ │
│ │ Ferramentas  Configurações                  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Passo 2: Criar Novo Aplicativo

1. Clique em **"Criar Aplicativo"** (botão azul no canto direito)
2. Selecione **"Negócios"** como tipo de app

```
┌──────────────────────────────────┐
│ Qual é o seu caso de uso?        │
├──────────────────────────────────┤
│ ○ Consumidor                     │
│ ○ Negócios (SELECIONAR ESTE)    │
│ ○ Outro                          │
└──────────────────────────────────┘
```

### Passo 3: Preencher Informações

Preencha com:
- **Nome do Aplicativo:** `Echo IA` (ou seu nome)
- **Email:** seu email corporativo
- **Finalidade do App:** "Automação de atendimento ao cliente"

```
┌────────────────────────────────────────────┐
│ Detalhes da Aplicação                      │
├────────────────────────────────────────────┤
│ Nome do Aplicativo *                       │
│ [Echo IA                                   │
│                                            │
│ Email de Contato para o App *              │
│ [seu.email@empresa.com                     │
│                                            │
│ Qual é a finalidade do seu aplicativo? *   │
│ [Automação de atendimento ao cliente       │
│                                            │
│                 [Criar Aplicativo]         │
└────────────────────────────────────────────┘
```

### Passo 4: Completar Setup de Segurança

Meta pode pedir verificação de segurança. Se solicitar:
- Confirme seu email
- Autentique com 2FA se necessário

---

## Adicionar Produto WhatsApp

### Passo 1: Na página do seu app

Após criação, você estará no Dashboard do app.

1. Localize a seção **"Meus Produtos"** ou **"Adicionar Produto"**
2. Procure por **"WhatsApp"** na lista

```
┌─────────────────────────────────────────┐
│ Meus Produtos                           │
├─────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐│
│ │ WhatsApp          [Configurar]       ││
│ │ Messenger         [Configurar]       ││
│ │ Instagram Graph   [Já Adicionado]    ││
│ │ + Procurar Mais Produtos             ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Passo 2: Clicar "Configurar"

Clique no botão **"Configurar"** próximo ao WhatsApp.

Meta vai abrir um wizard de configuração.

### Passo 3: Completar Configuração Rápida

Siga os passos:
1. **Qual é o seu caso de uso?**
   - Selecione: `Enviar mensagens de negócios`

2. **Como você conectará sua conta?**
   - Selecione: `Tenho uma conta de negócios existente`
   - (ou crie uma se não tiver)

3. **Teste de Envio**
   - Meta oferecerá um token de teste
   - **Guarde este token** (usaremos depois)

---

## Obter Credenciais

### Passo 1: Acessar Configurações Básicas

1. No Dashboard do seu app
2. Vá para **Configurações** → **Básico**

```
┌──────────────────────────────────┐
│ CONFIGURAÇÕES                    │
├──────────────────────────────────┤
│ ✓ Básico (SELECIONAR)            │
│ ○ Avançado                       │
│ ○ Funções                        │
│ ○ Aplicativos                    │
└──────────────────────────────────┘
```

### Passo 2: Copiar App ID e App Secret

Na página de Configurações Básicas, você verá:

```
┌────────────────────────────────────────────┐
│ Credenciais da Aplicação                   │
├────────────────────────────────────────────┤
│ ID do Aplicativo                           │
│ [1234567890123456789            ] [COPIAR] │
│                                            │
│ Chave Secreta da Aplicação                 │
│ [xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx] [COPIAR] │
│                                            │
│ (A chave secreta será ocultada por        │
│  questões de segurança)                    │
└────────────────────────────────────────────┘
```

**Copie e guarde:**
- `App ID` → será sua `META_APP_ID`
- `App Secret` → será sua `META_APP_SECRET`

⚠️ **IMPORTANTE:** Nunca compartilhe ou commite o App Secret!

---

## Configurar OAuth

### Passo 1: Adicionar URLs Autorizadas

Na página de **Configurações → Básico**, desça até:

**"URIs de redirecionamento OAuth"**

1. Clique em **"+ Adicionar URI"**
2. Adicione sua URL de callback:

**Para Desenvolvimento (localhost):**
```
http://localhost:3001/webhooks/whatsapp/callback
```

**Para Produção:**
```
https://seu-dominio.com/webhooks/whatsapp/callback
https://www.seu-dominio.com/webhooks/whatsapp/callback
```

```
┌────────────────────────────────────────────┐
│ URIs de redirecionamento OAuth             │
├────────────────────────────────────────────┤
│ [http://localhost:3001/webhooks/whatsapp/c] │
│ [https://seu-dominio.com/webhooks/whatsap] │
│                                            │
│ + Adicionar URI                            │
└────────────────────────────────────────────┘
```

3. Clique **"Salvar Alterações"**

### Passo 2: Configurar Domínios do App

Ainda em **Configurações → Básico**, procure por:

**"Domínios do Aplicativo"**

Adicione seus domínios:
- localhost (para dev)
- seu-dominio.com (para produção)

```
┌────────────────────────────────────────────┐
│ Domínios do Aplicativo                     │
├────────────────────────────────────────────┤
│ [localhost                                 │
│ [seu-dominio.com                           │
│ [www.seu-dominio.com                       │
│                                            │
│ + Adicionar Domínio                        │
└────────────────────────────────────────────┘
```

---

## Configurar Webhooks

### Passo 1: Acessar Configuração de Webhooks

1. No seu app, vá para **WhatsApp** (no menu esquerdo)
2. Clique em **"Configuração"**
3. Desça até a seção **"Webhooks"**

```
┌──────────────────────────────────────────┐
│ WHATSAPP                                 │
├──────────────────────────────────────────┤
│ • Primeiros passos                       │
│ • Configuração (SELECIONAR)              │
│ • API Setup                              │
│ • Modelos                                │
│ • Registros de atividade                 │
└──────────────────────────────────────────┘
```

### Passo 2: Editar Callback URL

1. Na seção **"Webhooks"**, clique **"Editar"**

```
┌────────────────────────────────────────────┐
│ Webhooks                                   │
├────────────────────────────────────────────┤
│                                            │
│ URL de Callback:                           │
│ [http://localhost:3001/webhooks/whatsapp] │
│                                            │
│ Token de Verificação:                      │
│ [seu_token_aleatorio_aqui______________]  │
│                                            │
│ [Cancelar]    [Verificar e Salvar]        │
└────────────────────────────────────────────┘
```

**Campo 1: URL de Callback**
- Para localhost: `http://localhost:3001/webhooks/whatsapp`
- Para produção: `https://seu-dominio.com/webhooks/whatsapp`

**Campo 2: Token de Verificação**
- Gere um token aleatório (mínimo 20 caracteres)
- Pode usar um gerador: https://www.uuidgenerator.net/
- **Guarde este token** → será `META_WEBHOOK_VERIFY_TOKEN`

### Passo 3: Clicar "Verificar e Salvar"

Meta enviará um GET para seu endpoint com o token.

Seu código em `http.ts` já lida com isso:
- Recebe o challenge
- Valida o token
- Retorna o challenge

Se tudo OK, Meta salvará a URL.

### Passo 4: Selecionar Eventos para Receber

Ainda na seção de Webhooks, procure por **"Campos de Webhook"**

Selecione os eventos que quer receber:

```
☑ messages           (Mensagens recebidas)
☑ message_status     (Status de entrega)
☑ message_template_status_update (Opcional)
○ account_alerts
```

**Importante:** Selecione pelo menos:
- ✅ `messages` (obrigatório)
- ✅ `message_status` (para rastrear entrega)

---

## Setup WhatsApp Business Account

### Passo 1: Verificar se tem Business Account

Se já tem uma conta WhatsApp Business, pule para o Passo 3.

Se não tem, continue.

### Passo 2: Criar WhatsApp Business Account

1. Acesse: https://www.whatsapp.com/business
2. Clique em **"Comece Agora"** ou **"Inscrever-se"**

```
┌────────────────────────────────────────┐
│ WhatsApp Business                      │
│                                        │
│ Gerencie seu negócio com WhatsApp     │
│                                        │
│        [COMECE AGORA]                 │
└────────────────────────────────────────┘
```

3. Selecione país e número de telefone
4. Siga os passos de verificação:
   - SMS ou ligação com código
   - Confirme o código

### Passo 3: Conectar Conta no Meta

1. Volte ao Meta Developers
2. Em WhatsApp → **Primeiros Passos**
3. Procure por **"Conectar Conta de Negócios"**

```
┌────────────────────────────────────────┐
│ Primeiros Passos                       │
├────────────────────────────────────────┤
│                                        │
│ Conectar Conta de Negócios             │
│ [CONECTAR CONTA]                       │
│                                        │
│ Isso permitirá que você acesse sua     │
│ conta WhatsApp Business no Meta.       │
└────────────────────────────────────────┘
```

4. Clique **"Conectar Conta"**
5. Autorize Meta a acessar sua conta WhatsApp

### Passo 4: Autorizar Permissões

Meta pedirá as seguintes permissões:
- ✅ Ler mensagens
- ✅ Enviar mensagens
- ✅ Gerenciar templates
- ✅ Acessar contatos

Clique **"Autorizar"** para todas.

### Passo 5: Selecionar Número de Telefone

Após autorização, Meta mostrará seus números disponíveis:

```
┌────────────────────────────────────────┐
│ Selecione um Número de Telefone        │
├────────────────────────────────────────┤
│ ○ +55 11 9999-9999                    │
│ ○ +55 21 8888-8888                    │
│ ○ Outro número...                     │
│                                        │
│ [Continuar]                            │
└────────────────────────────────────────┘
```

Selecione o número que você quer usar.

---

## Gerar Token Permanente

Os tokens que você gerou até agora expiram em ~24h.

Para produção, você precisa de um **token permanente**.

### Passo 1: Acessar API Setup

1. Em WhatsApp, vá para **"API Setup"**

```
┌──────────────────────────────────────┐
│ WHATSAPP                             │
├──────────────────────────────────────┤
│ • Primeiros passos                  │
│ • Configuração                      │
│ • API Setup (SELECIONAR)            │
│ • Modelos                           │
│ • Registros de atividade            │
└──────────────────────────────────────┘
```

### Passo 2: Obter Detalhes da Conta

Na página de API Setup, você verá:

```
┌──────────────────────────────────────┐
│ Informações da Conta                 │
├──────────────────────────────────────┤
│ ID da Conta de Negócios:             │
│ 123456789012345                      │
│                                      │
│ ID do Número de Telefone:            │
│ 987654321098765                      │
│                                      │
│ Número de Telefone:                  │
│ +5511999999999                       │
│                                      │
│ ID da Conta do Usuário:              │
│ 111222333444555                      │
└──────────────────────────────────────┘
```

**Guarde:**
- **PHONE_NUMBER_ID** → você já tem (do OAuth)
- **WABA_ID** → será guardado no banco (do OAuth)

### Passo 3: Gerar Token Permanente

Ainda em API Setup:

1. Procure por **"Geração de Token Permanente"**
2. Clique **"Gerar"**

```
┌──────────────────────────────────────┐
│ Tokens de Acesso                     │
├──────────────────────────────────────┤
│                                      │
│ Token de Acesso Temporário (24h)    │
│ [xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx]   │
│                                      │
│ Token de Acesso Permanente          │
│ [Gerar Token]                        │
│                                      │
│ Recomendado para produção.           │
└──────────────────────────────────────┘
```

3. Meta gerará um novo token que **não expira**

⚠️ **IMPORTANTE:**
- Guarde este token em local seguro
- Nunca commite no git
- Use em variáveis de ambiente seguras (AWS Secrets Manager, Vercel Secrets, etc)
- Este token será seu novo `META_ACCESS_TOKEN`

---

## Testar Conexão

### Teste 1: Verificar Webhook (GET)

Abra o terminal e execute:

```bash
curl -X GET "http://localhost:3001/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

**Esperado:** Retorna `test123`

Se receber `test123`, o webhook está funcionando! ✅

### Teste 2: Enviar Mensagem (cURL)

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
      "body": "Olá! Teste do Echo IA"
    }
  }'
```

**Substitua:**
- `PHONE_NUMBER_ID` → seu Phone Number ID
- `YOUR_ACCESS_TOKEN` → seu token
- `5511999999999` → número do destinatário (apenas dígitos)

**Esperado:** Retorna JSON com `message_id`

```json
{
  "messages": [
    {
      "id": "wamid.xxxxxxxxxxxxx"
    }
  ],
  "contacts": [
    {
      "input": "5511999999999",
      "wa_id": "5511999999999"
    }
  ]
}
```

Se receber isso, você consegue enviar mensagens! ✅

### Teste 3: Testar OAuth Flow

1. Vá para seu dashboard: `http://localhost:3001/integrations`
2. Clique em **"Connect WhatsApp"**
3. Meta redireciona pra OAuth
4. Faça login / Autorize
5. Meta redireciona de volta pra seu app
6. Você verá a conta conectada! ✅

---

## Environment Variables

Adicione estas variáveis no seu arquivo `.env.local`:

```env
# Meta OAuth
META_APP_ID=1234567890123456789
META_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_REDIRECT_URI=http://localhost:3001/webhooks/whatsapp/callback

# Webhook
META_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio_aqui

# App URL (para redirects)
APP_URL=http://localhost:3001

# Token de Acesso (use o token permanente para produção)
META_ACCESS_TOKEN=EAA...xxxxx (opcional - será obtido via OAuth)
```

**Para Produção, use:**

```env
META_APP_ID=seu_app_id_real
META_APP_SECRET=seu_secret_real
META_REDIRECT_URI=https://seu-dominio.com/webhooks/whatsapp/callback
META_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio
APP_URL=https://seu-dominio.com
```

---

## 📋 Checklist de Setup Completo

### Meta Developers
- [ ] App criado em https://developers.facebook.com
- [ ] Produto WhatsApp adicionado
- [ ] App ID copiado → `META_APP_ID`
- [ ] App Secret copiado → `META_APP_SECRET`
- [ ] URIs OAuth configuradas
- [ ] Domínios do app configurados
- [ ] Webhook URL: `http://localhost:3001/webhooks/whatsapp`
- [ ] Webhook Token gerado → `META_WEBHOOK_VERIFY_TOKEN`
- [ ] Eventos webhook habilitados (messages, message_status)
- [ ] WhatsApp Business Account conectado
- [ ] Token permanente gerado

### Seu Projeto
- [ ] `.env.local` criado com todas as variáveis
- [ ] Backend rodando (`npm run dev` ou `yarn dev`)
- [ ] Teste webhook GET executado com sucesso
- [ ] Teste de envio de mensagem executado
- [ ] OAuth flow testado (clique no botão)
- [ ] Conta aparece como conectada no dashboard
- [ ] Enviou mensagem no WhatsApp Business e recebeu resposta

---

## 🆘 Troubleshooting

### "Webhook URL não verificada"
- Certifique-se que seu app está rodando
- Verifique se a URL está correta
- Teste com cURL antes de salvar
- Verifique logs do servidor

### "Invalid Token"
- Tokens expiram em 24h
- Use o token permanente em produção
- Regenere um novo se necessário

### "Unauthorized" no envio de mensagem
- Verifique se o token não expirou
- Verifique se `PHONE_NUMBER_ID` está correto
- Verifique se o número de destino é válido

### "Message_status" retorna "failed"
- Número pode estar no formato errado
- Numero pode não existir ou estar desativado
- Pode estar fora da janela de 24h de resposta

---

## Links Úteis

- **Meta Developers:** https://developers.facebook.com
- **WhatsApp API Docs:** https://developers.facebook.com/docs/whatsapp/
- **WhatsApp Business:** https://www.whatsapp.com/business
- **Graph API Reference:** https://developers.facebook.com/docs/graph-api

---

**Agora você está pronto para usar WhatsApp no seu Echo IA! 🎉**
