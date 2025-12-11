import { QueryCtx } from "../../_generated/server";
import { ConvexError } from "convex/values";
import { Doc } from "../../_generated/dataModel";

/**
 * Seleciona o agente correto para responder uma conversa
 * Lógica:
 * 1. Verifica se existe agente específico para o canal
 * 2. Se não, usa o agente default da organização
 * 3. Se não houver nenhum, retorna null (não responde com IA)
 */
export async function selectAgentForChannel(
  ctx: QueryCtx,
  organizationId: string,
  channel?: string
): Promise<Doc<"aiAgents"> | null> {
  // 1. Se tiver canal especificado, busca assignment específico
  if (channel) {
    const assignment = await ctx.db
      .query("channelAgentAssignments")
      .withIndex("by_org_and_channel", (q) =>
        q.eq("organizationId", organizationId).eq("channel", channel)
      )
      .first();

    if (assignment) {
      const agent = await ctx.db.get(assignment.agentId);
      // Retorna apenas se estiver ativo
      if (agent && agent.isActive) {
        return agent;
      }
    }
  }

  // 2. Busca agente default da organização
  const defaultAgent = await ctx.db
    .query("aiAgents")
    .withIndex("by_organization_and_default", (q) =>
      q.eq("organizationId", organizationId).eq("isDefault", true)
    )
    .first();

  // Retorna apenas se estiver ativo
  if (defaultAgent && defaultAgent.isActive) {
    return defaultAgent;
  }

  // 3. Nenhum agente disponível
  return null;
}

/**
 * Busca o agente default de uma organização
 */
export async function getDefaultAgent(
  ctx: QueryCtx,
  organizationId: string
): Promise<Doc<"aiAgents"> | null> {
  const defaultAgent = await ctx.db
    .query("aiAgents")
    .withIndex("by_organization_and_default", (q) =>
      q.eq("organizationId", organizationId).eq("isDefault", true)
    )
    .first();

  return defaultAgent && defaultAgent.isActive ? defaultAgent : null;
}

/**
 * Busca o primeiro agente ativo de uma organização (fallback)
 */
export async function getFirstActiveAgent(
  ctx: QueryCtx,
  organizationId: string
): Promise<Doc<"aiAgents"> | null> {
  const agent = await ctx.db
    .query("aiAgents")
    .withIndex("by_organization_and_active", (q) =>
      q.eq("organizationId", organizationId).eq("isActive", true)
    )
    .first();

  return agent;
}
