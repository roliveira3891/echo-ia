// Mock data for AI Agents development

export type TemplateType = "support" | "sales" | "receptionist" | "custom";

export interface AIAgentTemplate {
  id: TemplateType;
  name: string;
  emoji: string;
  description: string;
  instructions: string;
}

export interface AIAgent {
  _id: string;
  name: string;
  emoji: string;
  instructions: string;
  templateType: TemplateType;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  stats?: {
    totalConversations: number;
    resolvedConversations: number;
    escalatedConversations: number;
    resolutionRate: number;
  };
}

// Templates disponíveis (hardcoded)
export const MOCK_TEMPLATES: AIAgentTemplate[] = [
  {
    id: "support",
    name: "Support Agent",
    emoji: "🎧",
    description: "Handle customer support tickets and provide instant help with common issues.",
    instructions: `# Support Assistant - Customer Service AI

## Identity & Purpose
You are a friendly, knowledgeable AI support assistant.
You help customers by searching the knowledge base for answers to their questions.

## IMPORTANT: Language Detection
**ALWAYS respond in the SAME language as the customer's message.**

## Available Tools
1. **searchTool** → search knowledge base for information
2. **escalateConversationTool** → connect customer with human agent
3. **resolveConversationTool** → mark conversation as complete

## Conversation Flow
1. Initial Customer Query → call searchTool immediately
2. After Search Results → provide clear answer
3. Escalation → offer human support if needed
4. Resolution → ask if anything else needed

## Style & Tone
* Friendly and professional
* Clear, concise responses
* Empathetic to frustrations
* Never make up information`,
  },
  {
    id: "sales",
    name: "Sales Agent",
    emoji: "💼",
    description: "Qualify leads, answer product questions, and book demos automatically.",
    instructions: `# Sales Assistant

## Identity & Purpose
You are a sales assistant for the organization.
Your role is to qualify leads, answer product questions, and move prospects through the sales pipeline.

## IMPORTANT: Language Detection
**ALWAYS respond in the SAME language as the customer's message.**

## Available Tools
1. **searchTool** → search knowledge base for product information
2. **escalateConversationTool** → connect with sales team for demos
3. **resolveConversationTool** → mark conversation as complete

## Conversation Flow
1. Qualify leads by asking key questions
2. Answer product questions using knowledge base
3. Book demos or schedule calls
4. Move qualified leads to sales team

## Style & Tone
* Consultative and knowledgeable
* Enthusiastic about products
* Professional yet friendly
* Focus on value, not just features`,
  },
  {
    id: "receptionist",
    name: "Receptionist",
    emoji: "📞",
    description: "Perfect for greeting visitors and routing conversations to the right team.",
    instructions: `# Receptionist Assistant

## Identity & Purpose
You are a friendly receptionist for the organization.
Your role is to warmly greet visitors and route them to the appropriate team.

## IMPORTANT: Language Detection
**ALWAYS respond in the SAME language as the customer's message.**

## Available Tools
1. **searchTool** → search for information to help route
2. **escalateConversationTool** → transfer to appropriate team
3. **resolveConversationTool** → close simple inquiries

## Conversation Flow
1. Greet visitors warmly
2. Understand their inquiry
3. Collect basic information
4. Route to appropriate team or answer simple questions

## Style & Tone
* Professional and welcoming
* Efficient yet friendly
* Clear communication`,
  },
];

// Agentes criados (mock - virá do banco depois)
export const MOCK_AGENTS: AIAgent[] = [
  {
    _id: "agent_1",
    name: "Support Agent",
    emoji: "🎧",
    instructions: MOCK_TEMPLATES[0].instructions,
    templateType: "support",
    isActive: true,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    stats: {
      totalConversations: 156,
      resolvedConversations: 142,
      escalatedConversations: 14,
      resolutionRate: 91,
    },
  },
  {
    _id: "agent_2",
    name: "Receptionist",
    emoji: "📞",
    instructions: MOCK_TEMPLATES[2].instructions,
    templateType: "receptionist",
    isActive: false,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    stats: {
      totalConversations: 45,
      resolvedConversations: 38,
      escalatedConversations: 7,
      resolutionRate: 84,
    },
  },
  {
    _id: "agent_3",
    name: "Sales Agent",
    emoji: "💼",
    instructions: MOCK_TEMPLATES[1].instructions,
    templateType: "sales",
    isActive: true,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    stats: {
      totalConversations: 89,
      resolvedConversations: 76,
      escalatedConversations: 13,
      resolutionRate: 85,
    },
  },
];

// Função helper para buscar template por ID
export const getTemplateById = (id: TemplateType): AIAgentTemplate | undefined => {
  return MOCK_TEMPLATES.find((t) => t.id === id);
};

// Função helper para buscar agente por ID
export const getAgentById = (id: string): AIAgent | undefined => {
  return MOCK_AGENTS.find((a) => a._id === id);
};
