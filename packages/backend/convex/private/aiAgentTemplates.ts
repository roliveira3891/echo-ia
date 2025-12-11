import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// QUERIES
// ========================================

/**
 * Lista todos os templates ativos (para o marketplace)
 */
export const listActive = query({
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("aiAgentTemplates")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .collect();

    return templates;
  },
});

/**
 * Lista todos os templates (incluindo inativos) - para admin
 */
export const listAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const templates = await ctx.db
      .query("aiAgentTemplates")
      .collect();

    return templates;
  },
});

/**
 * Busca um template por ID
 */
export const getById = query({
  args: {
    templateId: v.id("aiAgentTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);

    if (!template) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    return template;
  },
});

/**
 * Busca um template por templateId (string)
 */
export const getByTemplateId = query({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("aiAgentTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();

    return template;
  },
});

// ========================================
// MUTATIONS
// ========================================

/**
 * Cria um novo template
 */
export const create = mutation({
  args: {
    templateId: v.string(),
    name: v.string(),
    emoji: v.string(),
    description: v.string(),
    instructions: v.string(),
    isSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    // Verifica se já existe um template com esse templateId
    const existing = await ctx.db
      .query("aiAgentTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Template with this ID already exists",
      });
    }

    const templateId = await ctx.db.insert("aiAgentTemplates", {
      templateId: args.templateId,
      name: args.name,
      emoji: args.emoji,
      description: args.description,
      instructions: args.instructions,
      isActive: true,
      isSystem: args.isSystem ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: identity.subject,
    });

    return templateId;
  },
});

/**
 * Atualiza um template existente
 */
export const update = mutation({
  args: {
    id: v.id("aiAgentTemplates"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    await ctx.db.patch(args.id, {
      ...(args.name && { name: args.name }),
      ...(args.emoji && { emoji: args.emoji }),
      ...(args.description && { description: args.description }),
      ...(args.instructions && { instructions: args.instructions }),
      ...(args.isActive !== undefined && { isActive: args.isActive }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Deleta um template (apenas se não for system template)
 */
export const deleteTemplate = mutation({
  args: {
    id: v.id("aiAgentTemplates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    if (template.isSystem) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot delete system templates",
      });
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Toggle ativo/inativo de um template
 */
export const toggleActive = mutation({
  args: {
    id: v.id("aiAgentTemplates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    await ctx.db.patch(args.id, {
      isActive: !template.isActive,
      updatedAt: Date.now(),
    });

    return { isActive: !template.isActive };
  },
});
