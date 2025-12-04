# 🌿 Git Workflow - Echo IA

## 📋 Visão Geral

Este projeto usa um **Git Flow simplificado** para gerenciamento de código profissional.

---

## 🌳 Estrutura de Branches

### **`main`** (Produção)
- ✅ Código estável e testado
- ✅ Pronto para deploy
- 🔒 **Protegida** - Sem push direto
- ✅ Apenas via Pull Request

### **`develop`** (Desenvolvimento)
- ✅ Branch principal de desenvolvimento
- ✅ Código em progresso
- ✅ Integração contínua
- ⚠️ Pode ter push direto (por enquanto)

### **`feature/*`** (Features)
- ✅ Features específicas
- ✅ Exemplos: `feature/telegram-integration`, `feature/user-dashboard`
- ✅ Criadas a partir de `develop`
- ✅ Mergeadas via PR para `develop`

### **`fix/*`** (Bug Fixes)
- ✅ Correções de bugs
- ✅ Exemplos: `fix/whatsapp-webhook`, `fix/login-error`
- ✅ Criadas a partir de `develop`
- ✅ Mergeadas via PR para `develop`

### **`hotfix/*`** (Hotfixes)
- ✅ Correções urgentes em produção
- ✅ Criadas a partir de `main`
- ✅ Mergeadas em `main` E `develop`

---

## 🔄 Workflow Diário

### **1. Começar uma Nova Feature**

```bash
# Atualizar develop
git checkout develop
git pull origin develop

# Criar branch da feature
git checkout -b feature/nome-da-feature

# Trabalhar na feature...
git add .
git commit -m "feat: Implementa funcionalidade X"

# Push da branch
git push origin feature/nome-da-feature
```

### **2. Abrir Pull Request**

1. Vá para GitHub
2. Clique em "Compare & pull request"
3. **Base**: `develop` ← **Compare**: `feature/nome-da-feature`
4. Preencha o template do PR
5. Aguarde CI passar (build, lint, tests)
6. Faça o merge

### **3. Após Merge**

```bash
# Voltar para develop
git checkout develop
git pull origin develop

# Deletar branch local
git branch -d feature/nome-da-feature

# Deletar branch remota (opcional)
git push origin --delete feature/nome-da-feature
```

---

## 🚀 Deploy para Produção

### **Quando `develop` está estável:**

```bash
# 1. Criar PR de develop → main
git checkout develop
git pull origin develop

# 2. Abrir PR no GitHub
# Base: main ← Compare: develop

# 3. Revisar mudanças
# 4. CI deve passar
# 5. Fazer merge

# 6. Atualizar main local
git checkout main
git pull origin main

# 7. Tag de versão (opcional)
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

---

## 📝 Padrões de Commit

Use **Conventional Commits**:

```
<tipo>: <descrição curta>

<descrição longa opcional>

<rodapé opcional>
```

### **Tipos:**
- `feat:` - Nova feature
- `fix:` - Bug fix
- `docs:` - Apenas documentação
- `style:` - Formatação, ponto-e-vírgula, etc
- `refactor:` - Refatoração de código
- `perf:` - Melhoria de performance
- `test:` - Adiciona ou corrige testes
- `chore:` - Mudanças em build, configs, etc

### **Exemplos:**

```bash
git commit -m "feat: Add Telegram bot integration"

git commit -m "fix: Resolve WhatsApp webhook timeout issue"

git commit -m "docs: Update API documentation"

git commit -m "refactor: Simplify channel connection logic"
```

---

## 🔒 Regras de Proteção (GitHub)

### **Branch `main`:**

1. Vá para GitHub → Settings → Branches
2. Clique em "Add rule"
3. Branch name pattern: `main`
4. Marque:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Selecione: `build`, `lint` (quando CI estiver configurado)
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators (opcional)

### **Branch `develop`:** (Opcional)

- Sem proteção inicial (já que é só você)
- Quando entrar outro dev, adicione:
  - ✅ Require a pull request before merging

---

## 🎯 Fluxo Simplificado (Solo Developer)

### **Para features pequenas/médias:**

```bash
# Trabalhar direto no develop (por enquanto)
git checkout develop
git pull origin develop

# Fazer mudanças
git add .
git commit -m "feat: Add feature X"
git push origin develop
```

### **Para features grandes/importantes:**

```bash
# Usar branch feature
git checkout -b feature/nome
# ... trabalhar ...
git push origin feature/nome
# Abrir PR para develop
```

### **Para deploy em produção:**

```bash
# SEMPRE usar PR de develop → main
# Nunca push direto em main
```

---

## ⚠️ Regras Importantes

### **✅ SEMPRE:**
- Commitar mudanças relacionadas juntas
- Escrever mensagens de commit descritivas
- Testar localmente antes de push
- Usar PR para merge em `main`
- Manter `develop` atualizado

### **❌ NUNCA:**
- Push direto em `main`
- Commitar com mensagens vagas ("fix", "update", etc)
- Commitar código que não compila
- Commitar secrets/senhas
- Fazer force push sem necessidade

---

## 🆘 Comandos Úteis

### **Desfazer último commit (mantém mudanças):**
```bash
git reset --soft HEAD~1
```

### **Desfazer mudanças não commitadas:**
```bash
git checkout -- <file>
# ou
git restore <file>
```

### **Ver diferenças:**
```bash
git diff                    # Mudanças não staged
git diff --staged           # Mudanças staged
git diff develop..main      # Diferenças entre branches
```

### **Atualizar branch com develop:**
```bash
git checkout feature/minha-feature
git rebase develop
# ou
git merge develop
```

### **Limpar branches locais deletadas:**
```bash
git fetch --prune
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
```

---

## 📊 Exemplo Visual

```
main (produção)
  │
  ├─── develop (desenvolvimento)
  │      │
  │      ├─── feature/telegram
  │      │      │
  │      │      └─── PR → develop ✅
  │      │
  │      ├─── feature/instagram
  │      │      │
  │      │      └─── PR → develop ✅
  │      │
  │      └─── PR → main ✅ (quando estável)
  │
  └─── hotfix/critical-bug
         │
         └─── PR → main ✅
               └─── Merge back → develop ✅
```

---

## 🎓 Quando Outro Dev Entrar

### **Adicionar ao workflow:**

1. **Código review obrigatório**:
   - Configurar no GitHub: "Require approvals: 1"

2. **Branch develop também protegida**:
   - Require PR antes de merge

3. **Comunicação**:
   - Usar issues do GitHub
   - Comentar nos PRs
   - Usar discussions se necessário

---

## 📚 Recursos

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)

---

**Criado em:** 2025-12-04
**Status:** ✅ Ativo
**Versão:** 1.0
