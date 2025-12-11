import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ========================================
// QUERIES
// ========================================

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const orgId = identity.orgId as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    return await ctx.db
      .query("channelAgentAssignments")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();
  },
});

export const getByChannel = query({
  args: { channel: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const orgId = identity.orgId as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    return await ctx.db
      .query("channelAgentAssignments")
      .withIndex("by_org_and_channel", (q) =>
        q.eq("organizationId", orgId).eq("channel", args.channel)
      )
      .first();
  },
});

// ========================================
// MUTATIONS
// ========================================

export const assign = mutation({
  args: {
    channel: v.string(),
    agentId: v.id("aiAgents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const orgId = identity.orgId as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    // Verifica se o agente pertence à organização
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Agent not found or access denied" });
    }

    // Verifica se já existe assignment para esse canal
    const existing = await ctx.db
      .query("channelAgentAssignments")
      .withIndex("by_org_and_channel", (q) =>
        q.eq("organizationId", orgId).eq("channel", args.channel)
      )
      .first();

    if (existing) {
      // Atualiza o assignment existente
      await ctx.db.patch(existing._id, {
        agentId: args.agentId,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Cria novo assignment
      return await ctx.db.insert("channelAgentAssignments", {
        organizationId: orgId,
        channel: args.channel,
        agentId: args.agentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const unassign = mutation({
  args: { channel: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const orgId = identity.orgId as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    const assignment = await ctx.db
      .query("channelAgentAssignments")
      .withIndex("by_org_and_channel", (q) =>
        q.eq("organizationId", orgId).eq("channel", args.channel)
      )
      .first();

    if (assignment) {
      await ctx.db.delete(assignment._id);
    }

    return { success: true };
  },
});
