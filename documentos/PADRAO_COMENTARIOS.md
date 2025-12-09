# 📝 Padrão de Comentários - Echo IA

> Guia profissional para adicionar comentários ao código do projeto Echo IA

## 🎯 Objetivo

Comentários claros, úteis e profissionais que:
- ✅ Explicam o **POR QUÊ**, não o O QUÊ
- ✅ São fáceis de ler e manter
- ✅ Não poluem o código
- ✅ Seguem convenções TypeScript/React
- ✅ Ajudam novos desenvolvedores

---

## 📋 Tipos de Comentários

### 1️⃣ JSDoc - Funções e Classes (OBRIGATÓRIO)

**Padrão:**

```typescript
/**
 * Descrição breve da função
 * 
 * Descrição detalhada (opcional)
 * Explique quando usar, comportamento especial, etc
 * 
 * @param nome - Descrição do parâmetro
 * @param outro - Outro parâmetro
 * @returns Descrição do retorno
 * 
 * @example
 * const resultado = minhaFuncao(10)
 * console.log(resultado) // 20
 * 
 * @throws Error - Quando algo dá errado
 * 
 * @see {@link https://exemplo.com} para mais info
 */
function minhaFuncao(nome: string): string {
  // implementação
}
```

**Exemplos Reais:**

```typescript
/**
 * Obtém todas as conversas de uma organização
 * 
 * Busca conversas no banco Convex, filtradas por organizationId.
 * Retorna em ordem decrescente de data (mais recentes primeiro).
 * 
 * @param ctx - Contexto Convex com autenticação
 * @param organizationId - ID da organização
 * @param limit - Número máximo de resultados (padrão: 50)
 * @returns Array de conversas com metadata
 * 
 * @example
 * const conversas = await getConversations(ctx, 'org_123', 10)
 * 
 * @throws Error - Se organizationId for inválido
 */
export const getConversations = query({
  args: { 
    organizationId: v.id('organizations'),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // implementação
  }
})
```

---

### 2️⃣ JSDoc - Componentes React

**Padrão:**

```typescript
/**
 * Componente que renderiza um card de conversa
 * 
 * Exibe informações da conversa:
 * - Nome do contato
 * - Última mensagem
 * - Status (unresolved, escalated, resolved)
 * - Timestamp
 * 
 * @component
 * @example
 * <ConversationCard 
 *   conversation={conv}
 *   onSelect={() => handleSelect(conv.id)}
 * />
 */
export interface ConversationCardProps {
  /** Dados da conversa para exibir */
  conversation: Conversation
  /** Callback quando card é clicado */
  onSelect?: (id: string) => void
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onSelect
}) => {
  return (
    // JSX aqui
  )
}
```

---

### 3️⃣ Comentários em Linha - Explicar Lógica Complexa

**Use quando:**
- Lógica não óbvia
- Algoritmo complexo
- Decisão de design importante
- Comportamento inesperado

**RUIM:**

```typescript
// Iterando sobre items
for (let i = 0; i < items.length; i++) {
  // Verificar se item existe
  if (items[i]) {
    // Adicionar ao array
    result.push(items[i])
  }
}
```

**BOM:**

```typescript
// Filtrar items nulos (bugs anteriores adicionavam nulos ao array)
// TODO: Refatorar para usar items.filter(Boolean) na próxima sprint
for (let i = 0; i < items.length; i++) {
  if (items[i]) {
    result.push(items[i])
  }
}
```

---

### 4️⃣ Comentários de Bloco - Seções Importantes

```typescript
// ============================================
// Carregamento de dados inicial
// ============================================

const conversations = useQuery(api.conversations.get)
const messages = useQuery(api.messages.getByConversation, {
  conversationId: id
})

// ============================================
// Handlers e callbacks
// ============================================

const handleSendMessage = async (message: string) => {
  // implementação
}
```

---

### 5️⃣ Comentários de Aviso/Nota

**Use `//` para anotações rápidas:**

```typescript
export function complexFunction() {
  // ⚠️ CUIDADO: Esta função usa muita memória, avoid em loops
  const allData = loadEverything()
  
  // 🐛 BUG: API retorna timestamp em ms às vezes e em s outras
  // Issue: #1234
  const time = Math.ceil(data.timestamp * 1000)
  
  // TODO: Refatorar para usar Convex queries em vez de map
  return data.map(processItem)
  
  // NOTE: Convex tem limite de 1000 items por query
  // Usar paginação para resultados maiores
}
```

---

### 6️⃣ JSDoc - Tipos e Interfaces

```typescript
/**
 * Representa uma conversa com um contato
 * 
 * @interface Conversation
 * @property {string} id - ID único da conversa (threadId)
 * @property {string} organizationId - ID da organização proprietária
 * @property {string} contactSessionId - Referência à sessão do contato
 * @property {'unresolved' | 'escalated' | 'resolved'} status - Status atual
 * @property {number} createdAt - Timestamp de criação (ms)
 * @property {number} updatedAt - Timestamp da última atualização
 */
export interface Conversation {
  id: string
  organizationId: string
  contactSessionId: string
  status: 'unresolved' | 'escalated' | 'resolved'
  createdAt: number
  updatedAt: number
}
```

---

## 📝 Exemplos Completos

### Exemplo 1: Hook Customizado

```typescript
/**
 * Hook para gerenciar conversas de uma organização
 * 
 * Fornece acesso a conversas, abas (unresolved/escalated/resolved)
 * e funções para interagir com elas.
 * 
 * @param organizationId - ID da organização
 * @returns Objeto com conversas, tababas e handlers
 * 
 * @example
 * const { conversations, activeTab, selectConversation } = useConversations('org_123')
 * 
 * @see ConversationsView para exemplo de uso completo
 */
export function useConversations(organizationId: string) {
  // Query todas as conversas da organização
  const conversations = useQuery(api.conversations.getByOrganization, {
    organizationId
  })

  // Estado da aba ativa (unresolved, escalated, resolved)
  const [activeTab, setActiveTab] = useState<ConversationStatus>('unresolved')

  // Filtrar conversas pela aba ativa
  const filtered = conversations?.filter(c => c.status === activeTab) ?? []

  // Handler para selecionar conversa
  const selectConversation = (id: string) => {
    // Navegar para detalhe da conversa
    router.push(`/conversations/${id}`)
  }

  return {
    conversations: filtered,
    activeTab,
    setActiveTab,
    selectConversation,
    isLoading: conversations === undefined
  }
}
```

### Exemplo 2: Componente React Complexo

```typescript
/**
 * Widget de chat embarcável em qualquer website
 * 
 * Renderiza um chat completo que:
 * 1. Cria sessão anônima do contato
 * 2. Gerencia mensagens em tempo real
 * 3. Suporta sugestões de perguntas
 * 4. Integra com IA (OpenAI)
 * 5. Oferece voice input (Vapi)
 * 
 * @component
 * @param {string} organizationId - ID da organização proprietária
 * @param {WidgetConfig} config - Configurações de customização
 * 
 * @example
 * <ChatWidget
 *   organizationId="org_123"
 *   config={{ position: 'bottom-right', theme: 'dark' }}
 * />
 */
export const ChatWidget: React.FC<ChatWidgetProps> = ({
  organizationId,
  config = defaultConfig
}) => {
  // ============================================
  // Setup inicial
  // ============================================

  // Criar sessão anônima para rastrear conversa
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Carregamento de dados da sessão
  useEffect(() => {
    const createSession = async () => {
      const session = await createContactSession({
        organizationId,
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      })
      setSessionId(session.id)
    }
    createSession()
  }, [organizationId])

  // ============================================
  // Renderização
  // ============================================

  if (!sessionId) {
    return <LoadingSpinner /> // Sessão carregando
  }

  return (
    <ChatContainer>
      {/* Cabeçalho do chat */}
      <ChatHeader />
      
      {/* Área de mensagens */}
      <MessageList sessionId={sessionId} />
      
      {/* Input de mensagem */}
      <MessageInput onSend={handleSendMessage} />
    </ChatContainer>
  )
}
```

### Exemplo 3: Função de Backend Complexa

```typescript
/**
 * Agente de suporte com IA que processa conversas
 * 
 * Fluxo:
 * 1. Busca mensagens anteriores para contexto
 * 2. Busca documentos relevantes (RAG)
 * 3. Formata prompt customizado
 * 4. Chama OpenAI API com streaming
 * 5. Aplica ferramentas (search, escalate, resolve)
 * 6. Armazena resposta no banco
 * 7. Notifica clientes via WebSocket
 * 
 * @param ctx - Contexto Convex
 * @param conversationId - ID da conversa
 * @param userMessage - Mensagem do usuário
 * @returns Promise<Message> - Resposta do agente
 * 
 * @throws Error - Se falhar em chamar OpenAI ou armazenar
 * 
 * @example
 * const response = await supportAgent(ctx, 'conv_123', 'Como funciona?')
 * 
 * @see {@link rag.ts} para função de busca semântica
 * @see {@link constants.ts} para prompts customizados
 */
export const supportAgent = mutation({
  args: {
    conversationId: v.id('conversations'),
    userMessage: v.string()
  },
  handler: async (ctx, args) => {
    // ============================================
    // 1. Buscar contexto da conversa
    // ============================================

    // Pegar até 10 mensagens anteriores para contexto
    const previousMessages = await ctx.db
      .query('messages')
      .filter(q => q.eq(q.field('conversationId'), args.conversationId))
      .order('desc')
      .take(10)
      .collect()

    // Reverter para ordem cronológica (mais antigas primeiro)
    const context = previousMessages.reverse()

    // ============================================
    // 2. Buscar documentos relevantes (RAG)
    // ============================================

    // Usar embeddings para encontrar documentos semelhantes
    const relevantDocs = await searchDocuments(
      args.userMessage,
      args.organizationId
    )

    // ============================================
    // 3. Formatar prompt para IA
    // ============================================

    const prompt = formatSupportPrompt({
      context,
      userMessage: args.userMessage,
      documents: relevantDocs,
      customInstructions: widgetSettings?.customInstructions
    })

    // ============================================
    // 4. Chamar OpenAI com streaming
    // ============================================

    let aiResponse = ''
    
    // Stream respostas para melhor UX
    const stream = await openai.beta.assistants.messages.create({
      assistant_id: 'asst_...',
      thread_id: conversation.threadId,
      messages: [{ role: 'user', content: prompt }]
    })

    // Acumular resposta conforme chega
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        aiResponse += chunk.delta.text
      }
    }

    // ============================================
    // 5. Aplicar ferramentas se necessário
    // ============================================

    // Detectar se deve buscar mais informações
    if (shouldSearch(aiResponse)) {
      const searchResults = await searchTool(aiResponse)
      aiResponse += `\n\nResultados adicionais: ${searchResults}`
    }

    // Detectar se deve escalar para humano
    if (shouldEscalate(aiResponse)) {
      await updateConversationStatus(args.conversationId, 'escalated')
      // Notificar time de suporte
      await notifyTeam(args.conversationId)
    }

    // ============================================
    // 6. Armazenar resposta
    // ============================================

    const message = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      sender: 'ai',
      content: aiResponse,
      createdAt: Date.now()
    })

    // ============================================
    // 7. Notificar clientes (WebSocket)
    // ============================================

    // Convex automaticamente notifica subscribers
    // via live queries

    return message
  }
})
```

---

## 🚫 O QUE NÃO FAZER

```typescript
// ❌ Comentários óbvios
const age = 25 // idade
const name = 'João' // nome

// ❌ Comentários que repetem o código
// Incrementar contador
i++

// ❌ Comentários desatualizados (PIOR!)
// Convex 0.5 não suportava queries, use mutation
useQuery(api.getData) // ❌ Desatualizado!

// ❌ Comentários muito longos (use funções em vez disso)
// Este código faz: pega array, filtra nulos, mapeia para objeto,
// ordena por data, limita a 10, retorna com timestamp
const result = array
  .filter(Boolean)
  .map(toObject)
  .sort((a, b) => a.date - b.date)
  .slice(0, 10)

// ✅ Melhor: usar função nomeada
const getLatestItems = (array) => array
  .filter(Boolean)
  .map(toObject)
  .sort((a, b) => a.date - b.date)
  .slice(0, 10)
```

---

## ✅ Checklist de Comentários

Antes de fazer commit, verifique:

- [ ] Funções públicas tem JSDoc com `@param`, `@returns`
- [ ] Componentes React têm JSDoc com `@component`, `@example`
- [ ] Lógica complexa tem comentários em linha explicando **por quê**
- [ ] TODO/FIXME/BUG têm contexto e referência de issue
- [ ] Nenhum comentário desatualizado
- [ ] Sem comentários óbvios ("incrementar i")
- [ ] Sem código comentado (delete em vez disso)
- [ ] Comentários estão em português ou inglês consistentemente

---

## 📋 Templates Rápidos

### Function Template

```typescript
/**
 * [Uma linha descrevendo O QUÊ faz]
 * 
 * [Descrição detalhada - POR QUÊ, quando usar, comportamento especial]
 * 
 * @param {type} name - descrição
 * @returns {type} descrição
 * 
 * @example
 * const resultado = minhaFuncao(arg)
 * 
 * @throws Error - [quando e por quê]
 */
export function minhaFuncao(arg: type): type {
  // implementação
}
```

### Component Template

```typescript
/**
 * [Uma linha descrevendo o componente]
 * 
 * [O que renderiza e como funciona]
 * 
 * @component
 * @example
 * <MeuComponente prop="valor" />
 */
export const MeuComponente: React.FC<Props> = (props) => {
  return <div>content</div>
}
```

### Complex Logic Template

```typescript
// Descrição clara de POR QUÊ fazer isso
// Referência: issue #123, PR #456
const resultado = complexLogic()
```

---

## 🎯 Resumo das Regras

| Situação | Use | Exemplo |
|----------|-----|---------|
| Função pública | JSDoc | `/** Descrição @param ... @returns ... */` |
| Componente React | JSDoc + @component | `/** ... @component @example ... */` |
| Lógica não óbvia | Comentário em linha | `// Motivo da implementação` |
| Seção do código | Bloco com `// ===` | Dividir lógica em seções |
| Aviso importante | `// ⚠️ ...` | Performance, behavior, bugs |
| TODO/FIXME | Com contexto | `// TODO: Refatorar, issue #123` |
| Tipo/Interface | JSDoc | `/** @interface @property ... */` |
| Hook customizado | JSDoc | `/** @returns { ... }` |

---

## 🚀 Como Adicionar a Código Existente

### Passo 1: Identify Priority
1. Funções públicas (sempre)
2. Componentes React (sempre)
3. Lógica complexa (quando necessário)
4. Utils (se não óbvio)

### Passo 2: Add JSDoc

```typescript
// ANTES
export function getUser(id: string) {
  // implementação
}

// DEPOIS
/**
 * Busca um usuário pelo ID
 * 
 * @param id - ID único do usuário
 * @returns Dados do usuário ou null se não encontrado
 * 
 * @example
 * const user = await getUser('user_123')
 */
export function getUser(id: string) {
  // implementação
}
```

### Passo 3: Add Inline Comments (se necessário)

```typescript
// Se houver lógica não óbvia, adicione explicação
// Por quê essa order de operações é importante
const result = processData()
```

---

## 📚 Recursos

- **JSDoc Guide**: https://jsdoc.app/
- **TypeScript JSDoc**: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- **React PropTypes**: https://react.dev/reference/react/PropTypes

---

**Lembre-se**: Bom comentário explica O QUÊ e POR QUÊ, não COMO. Se está explicando COMO, o código não é claro o suficiente!

Última atualização: Dezembro 2024
