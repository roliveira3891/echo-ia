import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  subscriptions: defineTable({
    organizationId: v.string(),
    status: v.string(),
  }).index("by_organization_id", ["organizationId"]),
  widgetSettings: defineTable({
    organizationId: v.string(),
    greetMessage: v.string(),
    defaultSuggestions: v.object({
      suggestion1: v.optional(v.string()),
      suggestion2: v.optional(v.string()),
      suggestion3: v.optional(v.string()),
    }),
    vapiSettings: v.object({
      assistantId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    }),
  }).index("by_organization_id", ["organizationId"]),
  plugins: defineTable({
    organizationId: v.string(),
    service: v.union(v.literal("vapi")),
    secretName: v.string(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_id_and_service", ["organizationId", "service"]),
  conversations: defineTable({
    threadId: v.string(),
    organizationId: v.string(),
    contactSessionId: v.id("contactSessions"),
    status: v.union(
      v.literal("unresolved"),
      v.literal("escalated"),
      v.literal("resolved")
    ),
    agentId: v.optional(v.id("aiAgents")),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_contact_session_id", ["contactSessionId"])
    .index("by_thread_id", ["threadId"])
    .index("by_status_and_organization_id", ["status", "organizationId"])
    .index("by_agent_id", ["agentId"]),
  contactSessions: defineTable({
    name: v.string(),
    email: v.string(),
    organizationId: v.string(),
    expiresAt: v.number(),
    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        language: v.optional(v.string()),
        languages: v.optional(v.string()),
        platform: v.optional(v.string()),
        vendor: v.optional(v.string()),
        screenResolution: v.optional(v.string()),
        viewportSize: v.optional(v.string()),
        timezone: v.optional(v.string()),
        timezoneOffset: v.optional(v.number()),
        cookieEnabled: v.optional(v.boolean()),
        referrer: v.optional(v.string()),
        currentUrl: v.optional(v.string()),
      })
    ),
    // Multi-channel support (optional for backwards compatibility)
    channel: v.optional(v.string()),          // "widget", "whatsapp", "instagram", "tiktok", etc.
    channelUserId: v.optional(v.string()),    // "+55119999999" (WhatsApp), "@username" (Instagram), etc.
    profilePictureUrl: v.optional(v.string()), // URL da foto de perfil do usuário (WhatsApp, Instagram, etc.)
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_channel_user_id", ["channel", "channelUserId"]),
  users: defineTable({
    name: v.string(),
  }),
  webhookLogs: defineTable({
    organizationId: v.string(),
    channel: v.string(),          // "whatsapp", "instagram", "tiktok", etc.
    eventType: v.string(),        // "message", "status", "qr_code", etc.
    success: v.boolean(),
    error: v.optional(v.string()),
    payload: v.any(),
    processedAt: v.number(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_channel", ["channel"]),
  // ========================================
  // CHANNEL CONNECTIONS (Agnóstico)
  // ========================================
  // Unified table for ALL channel integrations
  // Supports: WhatsApp, Telegram, Instagram, TikTok, Facebook Messenger, LinkedIn, etc.
  channelConnections: defineTable({
    organizationId: v.string(),

    // Channel identification
    channel: v.string(),                        // "whatsapp", "telegram", "instagram", etc.
    channelAccountId: v.string(),               // Unique ID in the channel (phone, @username, user_id)

    // Authentication credentials (flexible for any channel)
    credentials: v.object({
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      apiKey: v.optional(v.string()),
      apiSecret: v.optional(v.string()),
      webhookToken: v.optional(v.string()),
      webhookSecret: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),

    // Channel-specific metadata (JSON flexible)
    // WhatsApp: { phoneNumberId, phoneNumber, wabaId, businessAccountId }
    // Telegram: { botToken, botUsername, botId }
    // Instagram: { userId, username, pageId, pageAccessToken }
    channelMetadata: v.any(),

    // Universal status
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("pending")
    ),

    // Audit fields
    connectedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_channel", ["channel"])
    .index("by_org_and_channel", ["organizationId", "channel"])
    .index("by_channel_account_id", ["channel", "channelAccountId"]),

  // ========================================
  // AI AGENTS
  // ========================================

  // Templates globais (marketplace) - qualquer org pode usar para criar agentes
  aiAgentTemplates: defineTable({
    // Template identification
    templateId: v.string(),              // "support", "sales", "receptionist", etc. (unique)
    name: v.string(),                    // "Support Agent", "Sales Agent"
    emoji: v.string(),                   // "🎧", "💼"
    description: v.string(),             // Descrição do template para o marketplace
    instructions: v.string(),            // Prompt padrão do template

    // Metadata
    isActive: v.boolean(),               // Template ativo (aparece no marketplace)
    isSystem: v.boolean(),               // Template do sistema (não pode ser deletado)
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),   // userId do Clerk (para templates futuros)
  })
    .index("by_template_id", ["templateId"])
    .index("by_is_active", ["isActive"]),

  // Agentes configurados por organização (podem ter quantos quiserem)
  aiAgents: defineTable({
    organizationId: v.string(),

    // Configuration
    name: v.string(),                    // "Support Agent", "Sales Agent"
    emoji: v.string(),                   // "🎧", "💼"
    description: v.string(),             // Descrição curta do que o agente faz
    instructions: v.string(),            // Prompt completo (até 10000 chars)

    // Template info (opcional - referência ao template usado)
    templateId: v.optional(v.string()),  // ID do template usado para criar (se veio de template)

    // Status
    isActive: v.boolean(),               // Ativo/Inativo (toggle)
    isDefault: v.boolean(),              // Agente padrão da organização (só 1 pode ser true)

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),   // userId do Clerk
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_and_active", ["organizationId", "isActive"])
    .index("by_organization_and_default", ["organizationId", "isDefault"]),

  // Assignments de agentes por canal (opcional - se não tiver, usa o default)
  channelAgentAssignments: defineTable({
    organizationId: v.string(),
    channel: v.string(),                 // "whatsapp", "telegram", "widget", etc.
    agentId: v.id("aiAgents"),           // Qual agente responde esse canal

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_org_and_channel", ["organizationId", "channel"]) // Unique per org+channel
    .index("by_agent_id", ["agentId"]),

});
