# Commit Guidelines

## Objetivo
Manter um histórico de commits claro, organizado e rastreável para toda a equipe de desenvolvimento.

---

## Formato de Commit

### Estrutura Padrão
```
<tipo>: <descrição breve>

<corpo detalhado (opcional)>

<rodapé (opcional)>
```

### Exemplo Completo
```
feat: add WhatsApp integration via Evolution API

- Add channel and channelUserId fields to contactSessions
- Create system/channels.ts for multi-channel message handling
- Implement WhatsApp provider with sendMessage action
- Add webhook endpoint for WhatsApp messages

Closes #123
🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Tipos de Commit (Obrigatório)

Use um dos seguintes tipos no início do commit:

| Tipo | Uso | Exemplo |
|------|-----|---------|
| **feat** | Nova funcionalidade | `feat: add multi-channel integration` |
| **fix** | Correção de bug | `fix: AI assistant now responds in customer's language` |
| **refactor** | Reorganização de código sem mudar funcionalidade | `refactor: simplify message processing logic` |
| **test** | Adicionar ou atualizar testes | `test: add integration tests for WhatsApp webhook` |
| **docs** | Mudanças em documentação | `docs: update MULTI_CHANNEL_INTEGRATION.md` |
| **chore** | Tarefas de manutenção (deps, config, etc) | `chore: update dependencies` |
| **style** | Formatação de código (não muda lógica) | `style: format constants.ts` |
| **perf** | Melhoria de performance | `perf: optimize message search query` |

---

## Descrição Breve (Obrigatório)

- **Máximo 50 caracteres**
- Começar com letra maiúscula
- Não usar ponto final
- Usar imperativo: "add", "fix", "update", não "added", "fixed", "updated"
- Ser específico: `fix: language detection in AI prompts` ✓ vs `fix: bug` ✗

### Exemplos Bons
```
✓ feat: add WhatsApp integration
✓ fix: detect customer language in AI responses
✓ refactor: extract channel validation logic
✓ docs: add multi-channel architecture guide
```

### Exemplos Ruins
```
✗ added WhatsApp
✗ Fixed bugs
✗ changes
✗ WIP
```

---

## Corpo do Commit (Altamente Recomendado)

Use para commits **feat**, **fix**, **refactor** importantes:

- **Explique o QUÊ e o POR QUÊ**, não o COMO
- Separe parágrafos com linhas em branco
- Use bullet points para múltiplas mudanças
- Máximo 72 caracteres por linha
- Referencia issues: `Closes #123` ou `Fixes #456`

### Exemplo
```
feat: implement multi-channel message handler

Add channel-agnostic architecture for handling messages from multiple sources
(WhatsApp, Instagram, TikTok, etc). This allows us to scale to N channels
without modifying core logic.

Changes:
- Add 'channel' and 'channelUserId' fields to contactSessions
- Create system/channels.ts with handleIncomingMessage action
- Add system/providers/* for channel-specific implementations
- Add /webhooks/:channel endpoint for all providers
- Update schema.ts with webhookLogs table

Benefits:
- Extensible architecture for future channels
- No channel-specific logic in core conversation system
- DRY principle - reuses public/messages.create for all channels

Closes #45
```

---

## Rodapé (Obrigatório para Claude Code)

Sempre adicione:

```
🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

Ou se foi implementado manualmente:

```
🤖 Implemented with guidance from Claude Code

Co-Authored-By: Developer Name <email@example.com>
```

---

## Casos Específicos do Projeto

### Commits do Claude Code
Formato padrão que o Claude usa:

```
feat: add X feature

<descrição>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commits Manuais com Guidance do Claude
Se você implementou mas seguiu planejamento do Claude:

```
feat: implement X feature as planned

<descrição>

🤖 Implemented with guidance from Claude Code

Co-Authored-By: Your Name <your.email@example.com>
```

### Bugs Encontrados e Fixados
```
fix: description of what was wrong

Why it was broken:
- Root cause 1
- Root cause 2

How it was fixed:
- Solution 1
- Solution 2

Testing:
- How to verify the fix

Closes #issue_number
```

---

## Multi-Channel Integration Project

### Commits esperados na Phase 1

```
feat: add schema for multi-channel contactSessions
feat: implement system/channels.ts handler
feat: add WhatsApp provider with Evolution API
feat: add webhook endpoint for message routing
test: add integration tests for message flow
docs: update MULTI_CHANNEL_INTEGRATION.md with implementation notes
```

### Padrão para novos canais (Instagram, TikTok, etc)

```
feat: add Instagram integration provider

- Create system/providers/instagram.ts with sendMessage action
- Add Meta Graph API client integration
- Update http.ts to handle /webhooks/instagram endpoint
- Test full flow: Instagram message → conversation → response

The implementation follows the same pattern as WhatsApp provider,
proving the channel-agnostic architecture is working as designed.
```

---

## Checklist Antes de Fazer Commit

- [ ] Tipo de commit está correto? (feat, fix, refactor, etc)
- [ ] Descrição tem 50 caracteres ou menos?
- [ ] Descrição começa com maiúscula?
- [ ] Descrição usa imperativo?
- [ ] Código foi testado?
- [ ] Não há console.logs ou código comentado?
- [ ] Documentação foi atualizada?
- [ ] Referência issue se applicable?
- [ ] Tem rodapé com Claude Code credit?
- [ ] Mensagem é clara para alguém ler daqui a 6 meses?

---

## Dicas Práticas

### 1. Commits Pequenos e Focados
Bom:
```
feat: add contactSessions schema changes
feat: implement channels.ts handler
feat: add whatsapp provider
```

Ruim:
```
feat: implement entire multi-channel system in one commit
```

### 2. Mensagens Descritivas
Bom:
```
fix: AI now detects customer language from first message

Previously, the SUPPORT_AGENT_PROMPT was hardcoded in English only.
Now it dynamically detects Portuguese, Spanish, English, etc.
and responds in the customer's language throughout the conversation.
```

Ruim:
```
fix: language bug
```

### 3. Referência Issues
```
Closes #123
Fixes #456
Related to #789
```

### 4. Quebra de Mudanças (Breaking Changes)
```
feat: refactor message schema

BREAKING CHANGE: contactSessions now requires 'channel' field.
Old code will fail if 'channel' is not provided.
See MIGRATION.md for upgrade instructions.
```

---

## Executando Commits

### Formato Básico
```bash
git add <files>
git commit -m "feat: description"
```

### Formato com Corpo
```bash
git commit -m "feat: description

- Change 1
- Change 2

Closes #123"
```

### Usando Heredoc (Recomendado para Claude Code)
```bash
git commit -m "$(cat <<'EOF'
feat: description

Detailed explanation here

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Commit Best Practices](https://chris.beams.io/posts/git-commit/)
- Histórico do projeto: `git log --oneline` para ver padrões anteriores

---

## Exemplos Reais do Projeto

```
✓ Fix: detect query param locale mismatch and redirect correctly
✓ Fix: pass locale as query parameter in Clerk fallback redirect
✓ Add localStorage locale synchronization in auth components
✓ Add query param locale fallback and validation to middleware
✓ Improve locale persistence: add localStorage fallback and explicit default
```

Seguir esses padrões! ✅

---

**Última atualização:** Dezembro 2024
**Responsável:** Claude Code
**Para questões:** Consulte MULTI_CHANNEL_INTEGRATION.md ou arquivo de arquitetura relevante
