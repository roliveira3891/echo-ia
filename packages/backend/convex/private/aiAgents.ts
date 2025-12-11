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
      .query("aiAgents")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("aiAgents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const agent = await ctx.db.get(args.id);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    const orgId = identity.orgId as string;
    if (agent.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied" });
    }

    return agent;
  },
});

export const getDefault = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const orgId = identity.orgId as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    return await ctx.db
      .query("aiAgents")
      .withIndex("by_organization_and_default", (q) =>
        q.eq("organizationId", orgId).eq("isDefault", true)
      )
      .first();
  },
});

// ========================================
// MUTATIONS
// ========================================

export const create = mutation({
  args: {
    name: v.string(),
    emoji: v.string(),
    description: v.optional(v.string()),
    instructions: v.string(),
    templateId: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const orgId = identity.orgId as string;
    if (!orgId) throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });

    // Se for default, remove o default dos outros
    if (args.isDefault) {
      const currentDefault = await ctx.db
        .query("aiAgents")
        .withIndex("by_organization_and_default", (q) =>
          q.eq("organizationId", orgId).eq("isDefault", true)
        )
        .first();

      if (currentDefault) {
        await ctx.db.patch(currentDefault._id, { isDefault: false });
      }
    }

    return await ctx.db.insert("aiAgents", {
      organizationId: orgId,
      name: args.name,
      emoji: args.emoji,
      description: args.description || "",
      instructions: args.instructions,
      templateId: args.templateId,
      isActive: true,
      isDefault: args.isDefault ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: identity.subject,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("aiAgents"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const agent = await ctx.db.get(args.id);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    const orgId = identity.orgId as string;
    if (agent.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied" });
    }

    await ctx.db.patch(args.id, {
      ...(args.name && { name: args.name }),
      ...(args.emoji && { emoji: args.emoji }),
      ...(args.description && { description: args.description }),
      ...(args.instructions && { instructions: args.instructions }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("aiAgents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const agent = await ctx.db.get(args.id);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    const orgId = identity.orgId as string;
    if (agent.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied" });
    }

    await ctx.db.patch(args.id, {
      isActive: !agent.isActive,
      updatedAt: Date.now(),
    });

    return { isActive: !agent.isActive };
  },
});

export const setAsDefault = mutation({
  args: { id: v.id("aiAgents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const agent = await ctx.db.get(args.id);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    const orgId = identity.orgId as string;
    if (agent.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied" });
    }

    // Remove default dos outros
    const currentDefault = await ctx.db
      .query("aiAgents")
      .withIndex("by_organization_and_default", (q) =>
        q.eq("organizationId", orgId).eq("isDefault", true)
      )
      .first();

    if (currentDefault && currentDefault._id !== args.id) {
      await ctx.db.patch(currentDefault._id, { isDefault: false });
    }

    await ctx.db.patch(args.id, { isDefault: true, updatedAt: Date.now() });

    return { success: true };
  },
});

export const deleteAgent = mutation({
  args: { id: v.id("aiAgents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHORIZED", message: "Identity not found" });

    const agent = await ctx.db.get(args.id);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    const orgId = identity.orgId as string;
    if (agent.organizationId !== orgId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied" });
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
