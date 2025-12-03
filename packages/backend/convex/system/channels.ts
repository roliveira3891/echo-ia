import { internalAction } from "../_generated/server";
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
      let contactSession = await ctx.db
        .query("contactSessions")
        .withIndex("by_channel_user_id")
        .filter((q: any) => q.eq(q.field("channel"), args.channel))
        .filter((q: any) => q.eq(q.field("channelUserId"), args.channelUserId))
        .filter((q: any) => q.eq(q.field("organizationId"), args.organizationId))
        .first();

      if (!contactSession) {
        const contactSessionId = await ctx.db.insert("contactSessions", {
          name: args.channelUserId,               // Nome é o identificador do canal
          email: `${args.channel}_${args.channelUserId}@local`,  // Email dummy
          organizationId: args.organizationId,
          expiresAt: Date.now() + SESSION_DURATION_MS,
          channel: args.channel,
          channelUserId: args.channelUserId,
        });
        contactSession = await ctx.db.get(contactSessionId);
      }

      if (!contactSession) {
        throw new Error("Failed to create or retrieve contact session");
      }

      // 2. Lookup/create conversation (agnóstico)
      let conversation = await ctx.db
        .query("conversations")
        .withIndex("by_contact_session_id")
        .filter((q: any) => q.eq(q.field("contactSessionId"), contactSession._id))
        .first();

      if (!conversation) {
        const threadId = `${args.channel}_${args.organizationId}_${args.channelUserId}_${Date.now()}`;
        const conversationId = await ctx.db.insert("conversations", {
          threadId,
          organizationId: args.organizationId,
          contactSessionId: contactSession._id,
          status: "unresolved",
        });
        conversation = await ctx.db.get(conversationId);

        if (!conversation) {
          throw new Error("Failed to create conversation");
        }

        // Mensagem de boas-vindas
        const widgetSettings = await ctx.db
          .query("widgetSettings")
          .withIndex("by_organization_id")
          .filter((q: any) => q.eq(q.field("organizationId"), args.organizationId))
          .first();

        await saveMessage(ctx, components.agent, {
          threadId,
          message: {
            role: "assistant",
            content: widgetSettings?.greetMessage || "Olá! Como posso ajudá-lo?",
          },
        });
      }

      // 3. Save user message to Convex Agent
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: {
          role: "user",
          content: args.messageText,
        },
      });

      // 4. Call public/messages.create (IA processa)
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

      // 7. Log webhook event (optional)
      await ctx.db.insert("webhookLogs", {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: true,
        payload: {
          channelUserId: args.channelUserId,
          externalMessageId: args.externalMessageId,
        },
        processedAt: Date.now(),
      });

    } catch (error) {
      // Log de erro
      await ctx.db.insert("webhookLogs", {
        organizationId: args.organizationId,
        channel: args.channel,
        eventType: "message",
        success: false,
        error: String(error),
        payload: args,
        processedAt: Date.now(),
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
    // case "instagram":
    //   return await ctx.runAction(internal.system.providers.instagram_provider.sendMessage, args);
    // case "tiktok":
    //   return await ctx.runAction(internal.system.providers.tiktok_provider.sendMessage, args);
    // TODO: Implement additional channel providers (Instagram, TikTok, etc)
    default:
      throw new Error(`Unknown channel: ${args.channel}`);
  }
}
