import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { supportAgent } from "./ai/agents/supportAgent";
import { saveMessage } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { SESSION_DURATION_MS } from "../constants";

/**
 * Main handler for incoming messages from any channel
 * Agnóstic to the source (WhatsApp, Instagram, TikTok, etc)
 *
 * Flow:
 * 1. Lookup/create contactSession by channel + channelUserId
 * 2. Lookup/create conversation
 * 3. Save user message to Convex Agent thread
 * 4. Call public/messages.create (AI processes)
 * 5. Get AI response from thread
 * 6. Send response via same channel
 * 7. Log webhook event (optional)
 */
export const handleIncomingMessage = internalAction({
  args: {
    channel: v.string(),                    // "whatsapp", "instagram", "tiktok", etc
    organizationId: v.string(),
    channelUserId: v.string(),              // Agnóstico: "+55119999999", "@user", "user_id_123", etc
    messageText: v.string(),
    externalMessageId: v.optional(v.string()), // ID do provider (para rastreamento)
  },
  handler: async (ctx: any, args: any) => {
    try {
      // 1. Lookup/create contactSession (agnóstico)
      const contactSession = await ctx.runMutation(
        internal.system.channels.getOrCreateContactSession,
        {
          channel: args.channel,
          channelUserId: args.channelUserId,
          organizationId: args.organizationId,
        }
      );

      if (!contactSession) {
        throw new Error("Failed to create or retrieve contact session");
      }

      // 2. Lookup/create conversation (agnóstico)
      const conversation = await ctx.runAction(
        internal.system.channels.getOrCreateConversation,
        {
          contactSessionId: contactSession._id,
          organizationId: args.organizationId,
          channel: args.channel,
          channelUserId: args.channelUserId,
        }
      );

      if (!conversation) {
        throw new Error("Failed to create conversation");
      }

      // 3. If conversation is resolved, reopen it automatically
      if (conversation.status === "resolved") {
        await ctx.runMutation(internal.system.channels.reopenConversation, {
          conversationId: conversation._id,
        });
        // Update local conversation object
        conversation.status = "unresolved";
      }

      // 4. Save user message to Convex Agent
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: {
          role: "user",
          content: args.messageText,
        },
      });

      // 5. Only process with AI if conversation is not escalated
      // If escalated, human operator will respond from dashboard
      if (conversation.status !== "escalated") {
        // Call public/messages.create (IA processa)
        await ctx.runAction(api.public.messages.create, {
          threadId: conversation.threadId,
          prompt: args.messageText,
          contactSessionId: contactSession._id,
        });

        // 5. Fetch AI response (última mensagem do thread)
        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        const aiResponse = messages.page[0];

        // 6. Send response via the same channel
        if (aiResponse) {
          // Extract message text from the AI response
          // The agent returns messages with various properties, we'll attempt to get the text content
          const messageText = (aiResponse as any).text || (aiResponse as any).content || "";

          if (messageText) {
            await sendMessageToChannel(ctx, {
              channel: args.channel,
              channelUserId: args.channelUserId,
              messageText,
              organizationId: args.organizationId,
            });
          }
        }
      }

      // 7. Log webhook event (optional)
      await ctx.runMutation(internal.system.channels.logWebhookEvent, {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: true,
        payload: {
          channelUserId: args.channelUserId,
          externalMessageId: args.externalMessageId,
        },
      });

    } catch (error) {
      // Log de erro
      await ctx.runMutation(internal.system.channels.logWebhookEvent, {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: false,
        error: String(error),
        payload: args,
      });
      throw error;
    }
  },
});

/**
 * Helper agnóstico para enviar mensagens para qualquer canal
 * Delega para o provider específico via switch
 */
async function sendMessageToChannel(
  ctx: any,
  args: {
    channel: string;
    channelUserId: string;
    messageText: string;
    organizationId: string;
  }
) {
  switch (args.channel) {
    case "whatsapp":
      return await ctx.runAction(internal.system.providers.whatsapp_provider.sendMessage, args);
    case "telegram":
      return await ctx.runAction(internal.system.providers.telegram_provider.sendMessage, args);
    // case "instagram":
    //   return await ctx.runAction(internal.system.providers.instagram_provider.sendMessage, args);
    // case "tiktok":
    //   return await ctx.runAction(internal.system.providers.tiktok_provider.sendMessage, args);
    // TODO: Implement additional channel providers (Instagram, TikTok, etc)
    default:
      throw new Error(`Unknown channel: ${args.channel}`);
  }
}

/**
 * Internal action: Send message to external channel
 * Called when a human operator sends a message from the dashboard
 */
export const sendMessageToExternalChannel = internalAction({
  args: {
    channel: v.string(),
    channelUserId: v.string(),
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      await sendMessageToChannel(ctx, args);

      // Log success
      await ctx.runMutation(internal.system.channels.logWebhookEvent, {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "operator_message",
        success: true,
        payload: {
          channelUserId: args.channelUserId,
          messageText: args.messageText,
        },
      });
    } catch (error) {
      // Log error
      await ctx.runMutation(internal.system.channels.logWebhookEvent, {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "operator_message",
        success: false,
        error: String(error),
        payload: args,
      });
      throw error;
    }
  },
});

/**
 * Internal mutation: Get or create contact session
 */
export const getOrCreateContactSession = internalMutation({
  args: {
    channel: v.string(),
    channelUserId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    let contactSession = await ctx.db
      .query("contactSessions")
      .withIndex("by_channel_user_id")
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .filter((q) => q.eq(q.field("channelUserId"), args.channelUserId))
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .first();

    if (!contactSession) {
      const contactSessionId = await ctx.db.insert("contactSessions", {
        name: args.channelUserId,
        email: `${args.channel}_${args.channelUserId}@local`,
        organizationId: args.organizationId,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        channel: args.channel,
        channelUserId: args.channelUserId,
      });
      contactSession = await ctx.db.get(contactSessionId);
    }

    return contactSession;
  },
});

/**
 * Internal action: Get or create conversation
 * Changed to action because we need to create thread via agent component
 */
export const getOrCreateConversation = internalAction({
  args: {
    contactSessionId: v.id("contactSessions"),
    organizationId: v.string(),
    channel: v.string(),
    channelUserId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Check if conversation exists
    let conversation: any = await ctx.runQuery(
      internal.system.channels.findConversationByContactSessionId,
      { contactSessionId: args.contactSessionId }
    );

    // Validate threadId - if it's an old invalid format (string instead of Id), recreate
    const isInvalidThreadId = conversation &&
      typeof conversation.threadId === 'string' &&
      conversation.threadId.startsWith('telegram_');

    if (!conversation || isInvalidThreadId) {
      // Delete old invalid conversation if exists
      if (isInvalidThreadId) {
        await ctx.runMutation(internal.system.channels.deleteConversation, {
          conversationId: conversation._id,
        });
      }
      // Create thread using agent component
      const { threadId } = await supportAgent.createThread(ctx, {
        userId: args.organizationId,
      });

      // Get widget settings for welcome message
      const widgetSettings = await ctx.runQuery(
        internal.system.channels.getWidgetSettings,
        { organizationId: args.organizationId }
      );

      // Send welcome message
      await saveMessage(ctx, components.agent, {
        threadId,
        message: {
          role: "assistant",
          content: widgetSettings?.greetMessage || "Olá! Como posso ajudá-lo?",
        },
      });

      // Create conversation with the thread ID
      const conversationId = await ctx.runMutation(
        internal.system.channels.createConversation,
        {
          threadId,
          organizationId: args.organizationId,
          contactSessionId: args.contactSessionId,
        }
      );

      conversation = await ctx.runQuery(
        internal.system.channels.getConversationById,
        { conversationId }
      );
    }

    return conversation;
  },
});

/**
 * Internal query: Find conversation by contact session ID
 */
export const findConversationByContactSessionId = internalQuery({
  args: {
    contactSessionId: v.id("contactSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_contact_session_id")
      .filter((q) => q.eq(q.field("contactSessionId"), args.contactSessionId))
      .first();
  },
});

/**
 * Internal mutation: Create conversation
 */
export const createConversation = internalMutation({
  args: {
    threadId: v.string(), // Accept string from agent component
    organizationId: v.string(),
    contactSessionId: v.id("contactSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      threadId: args.threadId as any, // Cast to Id<"threads"> for database
      organizationId: args.organizationId,
      contactSessionId: args.contactSessionId,
      status: "unresolved",
    });
  },
});

/**
 * Internal query: Get conversation by ID
 */
export const getConversationById = internalQuery({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

/**
 * Internal mutation: Delete conversation
 */
export const deleteConversation = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.conversationId);
  },
});

/**
 * Internal query: Get widget settings
 */
export const getWidgetSettings = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("widgetSettings")
      .withIndex("by_organization_id")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .first();
  },
});

/**
 * Internal mutation: Reopen a resolved conversation
 */
export const reopenConversation = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: "unresolved",
    });
  },
});

/**
 * Internal mutation: Log webhook event
 */
export const logWebhookEvent = internalMutation({
  args: {
    organizationId: v.string(),
    channel: v.string(),
    eventType: v.string(),
    success: v.boolean(),
    payload: v.any(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookLogs", {
      organizationId: args.organizationId,
      channel: args.channel,
      eventType: args.eventType,
      success: args.success,
      payload: args.payload,
      processedAt: Date.now(),
      error: args.error,
    });
  },
});
