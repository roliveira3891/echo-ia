import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../../_generated/api";
import { generateSecureToken } from "./_helpers";

/**
 * Connect Telegram bot
 * Validates bot token, saves connection, and sets up webhook
 *
 * Called from frontend when user submits bot token
 */
export const connect = internalAction({
  args: {
    organizationId: v.string(),
    botToken: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    try {
      // 1. Validate bot token with Telegram API
      const botInfo: any = await ctx.runAction(
        internal.system.providers.telegram_provider.validateBotToken,
        { botToken: args.botToken }
      );

      // 2. Generate webhook token for security
      const webhookToken = generateSecureToken();

      // 3. Save to channelConnections
      await ctx.runMutation(internal.system.channelConnections.upsertConnection, {
        organizationId: args.organizationId,
        channel: "telegram",
        channelAccountId: `@${botInfo.botUsername}`,
        credentials: {
          apiKey: args.botToken,
          webhookToken,
        },
        channelMetadata: {
          botId: botInfo.botId,
          botUsername: botInfo.botUsername,
          botName: botInfo.botName,
          canJoinGroups: botInfo.canJoinGroups,
          canReadAllGroupMessages: botInfo.canReadAllGroupMessages,
        },
        status: "connected",
      });

      // 4. Set up webhook with Telegram
      const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/webhooks/telegram?token=${webhookToken}`;

      await ctx.runAction(
        internal.system.providers.telegram_provider.setWebhook,
        {
          botToken: args.botToken,
          webhookUrl,
        }
      );

      return {
        success: true,
        organizationId: args.organizationId,
        botUsername: botInfo.botUsername,
        botName: botInfo.botName,
      };
    } catch (error) {
      // Log error for debugging
      console.error("[Telegram OAuth] Connection failed:", error);

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: `Failed to connect Telegram bot: ${String(error)}`,
      });
    }
  },
});

/**
 * Disconnect Telegram bot
 * Removes webhook and marks connection as disconnected
 */
export const disconnect = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    try {
      // 1. Get existing connection
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnection,
        {
          organizationId: args.organizationId,
          channel: "telegram",
        }
      );

      if (!connection) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Telegram connection not found",
        });
      }

      // 2. Delete webhook from Telegram
      const botToken = connection.credentials.apiKey;
      if (botToken) {
        await ctx.runAction(
          internal.system.providers.telegram_provider.deleteWebhook,
          { botToken }
        );
      }

      // 3. Mark as disconnected
      await ctx.runMutation(internal.system.channelConnections.disconnectChannel, {
        organizationId: args.organizationId,
        channel: "telegram",
      });

      return { success: true };
    } catch (error) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: `Failed to disconnect Telegram: ${String(error)}`,
      });
    }
  },
});
