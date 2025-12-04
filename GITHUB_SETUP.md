# ⚙️ Configuração do GitHub - Echo IA

## 🎯 Objetivo

Configurar proteções e automações no GitHub para manter o código profissional e seguro.

---

## 🔒 Passo 1: Proteger Branch `main`

### **No GitHub:**

1. Vá para o repositório
2. Clique em **Settings** (⚙️)
3. No menu lateral, clique em **Branches**
4. Clique em **Add branch protection rule**

### **Configurações para `main`:**

```
Branch name pattern: main

☑️ Require a pull request before merging
   ☑️ Require approvals: 1 (quando tiver outro dev)
   ☑️ Dismiss stale pull request approvals when new commits are pushed

☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
   Status checks:
   - build (quando CI estiver rodando)
   - lint (quando CI estiver rodando)

☑️ Require conversation resolution before merging

☑️ Do not allow bypassing the above settings
   ⚠️ Desmarque "Include administrators" (por enquanto, para você ter acesso)
```

**Clique em "Create"**

---

## 🔧 Passo 2: Configurar Secrets (Variáveis de Ambiente)

### **Para CI funcionar:**

1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**

### **Secrets necessários:**

```
Nome: CONVEX_DEPLOYMENT
Valor: [seu deployment ID do Convex]

Nome: META_APP_ID
Valor: [seu Meta App ID]

Nome: META_APP_SECRET
Valor: [seu Meta App Secret]

Nome: CLERK_SECRET_KEY
Valor: [seu Clerk Secret Key]

# Adicione outros conforme necessário
```

---

## 🏷️ Passo 3: Configurar Labels (Opcional mas Recomendado)

### **Labels úteis para Issues e PRs:**

1. Vá para **Issues** → **Labels**
2. Crie os seguintes labels:

```
🐛 bug          - Algo não está funcionando
✨ enhancement  - Nova feature ou request
📝 documentation - Melhoria na documentação
❓ question     - Dúvida ou discussão
🔥 hotfix       - Correção urgente
🚀 feature      - Nova funcionalidade
♻️ refactor     - Refatoração de código
🧪 testing      - Relacionado a testes
⚡ performance  - Melhoria de performance
🔒 security     - Questão de segurança
```

---

## 🤖 Passo 4: Ativar GitHub Actions

### **Verificar se Actions está ativa:**

1. Vá para **Settings** → **Actions** → **General**
2. Em "Actions permissions", selecione:
   ```
   ☑️ Allow all actions and reusable workflows
   ```
3. Em "Workflow permissions", selecione:
   ```
   ⚪ Read and write permissions
   ☑️ Allow GitHub Actions to create and approve pull requests
   ```

---

## 📊 Passo 5: Configurar Auto-merge (Opcional)

### **Para PRs pequenos e simples:**

1. Vá para **Settings** → **General**
2. Role até "Pull Requests"
3. Marque:
   ```
   ☑️ Allow auto-merge
   ☑️ Automatically delete head branches
   ```

---

## 🎯 Passo 6: Configurar Notificações

### **Para não perder nada importante:**

1. Clique na sua foto (canto superior direito)
2. **Settings** → **Notifications**
3. Configure:
   ```
   ☑️ Email - Pull request reviews
   ☑️ Email - Pull request pushes
   ☑️ Email - Comments on Issues and Pull Requests
   ☑️ Web - All of the above
   ```

---

## 📋 Passo 7: Configurar Templates (Já Criados!)

### **Verificar se estão no lugar:**

```
✅ .github/pull_request_template.md       (Template de PR)
✅ .github/workflows/ci.yml               (GitHub Actions CI)
```

Se quiser adicionar template de Issue:

**Criar:** `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Relatar um bug
title: '[BUG] '
labels: bug
assignees: ''
---

## Descrição do Bug
<!-- Descreva o bug claramente -->

## Passos para Reproduzir
1.
2.
3.

## Comportamento Esperado
<!-- O que deveria acontecer -->

## Comportamento Atual
<!-- O que está acontecendo -->

## Screenshots
<!-- Se aplicável -->

## Ambiente
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 1.0.0]
```

---

## ✅ Checklist de Configuração

Após seguir os passos acima, verifique:

- [ ] Branch `main` está protegida
- [ ] Secrets estão configurados
- [ ] GitHub Actions está ativa
- [ ] Labels foram criadas (opcional)
- [ ] Auto-merge configurado (opcional)
- [ ] Templates de PR/Issue existem
- [ ] Notificações configuradas

---

## 🚀 Primeira Vez Usando?

### **Fluxo completo:**

```bash
# 1. Criar branch develop (já feito!)
git checkout develop

# 2. Push da branch develop
git push -u origin develop

# 3. Trabalhar em features
git checkout -b feature/minha-feature

# 4. Commitar e push
git add .
git commit -m "feat: Add feature X"
git push origin feature/minha-feature

# 5. Abrir PR no GitHub
# develop ← feature/minha-feature

# 6. Aguardar CI passar
# 7. Fazer merge

# 8. Quando pronto para produção:
# main ← develop (via PR)
```

---

## 🆘 Troubleshooting

### **CI não está rodando:**
- Verifique se Actions está ativa (Passo 4)
- Verifique se o arquivo `.github/workflows/ci.yml` existe
- Verifique logs em **Actions** tab

### **Não consigo fazer push em main:**
- ✅ Isso é esperado! Use PR
- Se realmente precisar: Desmarque "Include administrators" nas regras

### **PR não pode ser mergeado:**
- CI precisa passar
- Conflitos precisam ser resolvidos
- Aprovação necessária (se configurado)

---

## 📚 Recursos Úteis

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Managing Labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)

---

**Criado em:** 2025-12-04
**Última atualização:** 2025-12-04
**Status:** ✅ Pronto para uso
