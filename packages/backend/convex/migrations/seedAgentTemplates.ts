import { internalMutation } from "../_generated/server";
import { SUPPORT_AGENT_PROMPT } from "../system/ai/constants";

/**
 * Migration para popular templates iniciais
 * Execute: npx convex run migrations:seedAgentTemplates
 */
export default internalMutation({
  handler: async (ctx) => {
    // Verifica se já existem templates
    const existingTemplates = await ctx.db.query("aiAgentTemplates").collect();

    if (existingTemplates.length > 0) {
      console.log("Templates já existem, pulando seed...");
      return { skipped: true, count: existingTemplates.length };
    }

    const now = Date.now();

    // Template 1: Support Agent
    await ctx.db.insert("aiAgentTemplates", {
      templateId: "support",
      name: "Support Agent",
      emoji: "🎧",
      description: "Handle customer support tickets and provide instant help with common issues.",
      instructions: SUPPORT_AGENT_PROMPT,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    });

    // Template 2: Sales Agent
    await ctx.db.insert("aiAgentTemplates", {
      templateId: "sales",
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
1. Qualify leads by understanding their needs
2. Answer product questions using searchTool
3. Book demos or schedule calls
4. Move qualified leads to sales team

## Style & Tone
* Consultative and knowledgeable
* Enthusiastic about products
* Professional yet friendly
* Focus on value, not just features`,
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    });

    // Template 3: Receptionist
    await ctx.db.insert("aiAgentTemplates", {
      templateId: "receptionist",
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
      isActive: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("✅ 3 templates criados com sucesso!");
    return { created: 3 };
  },
});
