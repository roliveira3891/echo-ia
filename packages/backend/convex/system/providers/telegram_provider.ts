import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../../_generated/api";
import {
  ensureActiveConnection,
  getRequiredCredential,
  formatProviderError,
} from "./_helpers";

/**
 * Send message via Telegram Bot API
 *
 * Called by system/channels.ts:sendMessageToChannel() when:
 * - A message arrives from Telegram webhook
 * - AI generates a response
 * - We need to send it back to the user
 */
export const sendMessage = internalAction({
  args: {
    channel: v.literal("telegram"),
    channelUserId: v.string(), // Telegram chat_id (numeric string)
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // 1. Get Telegram connection from channelConnections (agnostic)
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnection,
        {
          organizationId: args.organizationId,
          channel: "telegram",
        }
      );

      // Validate connection is active
      ensureActiveConnection(connection, "Telegram");

      // 2. Extract bot token from credentials
      const botToken = getRequiredCredential(
        connection.credentials,
        "apiKey",
        "Telegram"
      );

      // 3. Send message via Telegram Bot API
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: args.channelUserId,
            text: args.messageText,
            parse_mode: "HTML", // Support basic formatting
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = JSON.stringify(errorData);

        // Log error for debugging
        console.error(
          `[Telegram] Failed to send message to ${args.channelUserId}:`,
          errorMessage
        );

        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Telegram Bot API error: ${errorMessage}`,
        });
      }

      const responseData = (await response.json()) as {
        ok: boolean;
        result?: {
          message_id: number;
          chat: {
            id: number;
            type: string;
          };
        };
      };

      // 4. Return success with message ID
      const messageId = responseData.result?.message_id?.toString() || "unknown";

      return {
        success: true,
        messageId,
        chatId: args.channelUserId,
      };
    } catch (error) {
      // If it's already a ConvexError, rethrow it
      if (error instanceof ConvexError) {
        throw error;
      }

      // Otherwise wrap it
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Telegram", "sendMessage", error),
      });
    }
  },
});

/**
 * Validate bot token with Telegram API
 * Used during connection setup to verify the token is valid
 * Returns bot info if valid, throws if invalid
 */
export const validateBotToken = internalAction({
  args: {
    botToken: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${args.botToken}/getMe`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: `Invalid bot token: ${errorData.description || "Unknown error"}`,
        });
      }

      const data = (await response.json()) as {
        ok: boolean;
        result: {
          id: number;
          is_bot: boolean;
          first_name: string;
          username: string;
          can_join_groups: boolean;
          can_read_all_group_messages: boolean;
          supports_inline_queries: boolean;
        };
      };

      if (!data.ok || !data.result.is_bot) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Token is valid but not for a bot",
        });
      }

      return {
        botId: data.result.id.toString(),
        botUsername: data.result.username,
        botName: data.result.first_name,
        canJoinGroups: data.result.can_join_groups,
        canReadAllGroupMessages: data.result.can_read_all_group_messages,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Telegram", "validateBotToken", error),
      });
    }
  },
});

/**
 * Set webhook URL for Telegram bot
 * Called after successful connection to start receiving messages
 */
export const setWebhook = internalAction({
  args: {
    botToken: v.string(),
    webhookUrl: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${args.botToken}/setWebhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: args.webhookUrl,
            allowed_updates: ["message", "edited_message"],
            drop_pending_updates: true, // Clear old updates
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Failed to set webhook: ${errorData.description || "Unknown error"}`,
        });
      }

      const data = (await response.json()) as {
        ok: boolean;
        result: boolean;
        description?: string;
      };

      return {
        success: data.ok && data.result,
        description: data.description,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Telegram", "setWebhook", error),
      });
    }
  },
});

/**
 * Delete webhook for Telegram bot
 * Called when disconnecting to stop receiving messages
 */
export const deleteWebhook = internalAction({
  args: {
    botToken: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${args.botToken}/deleteWebhook`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Failed to delete webhook: ${errorData.description || "Unknown error"}`,
        });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Telegram", "deleteWebhook", error),
      });
    }
  },
});

/**
 * Get user profile photo URL
 * Fetches the profile photo of a Telegram user
 */
export const getUserProfilePhoto = internalAction({
  args: {
    botToken: v.string(),
    userId: v.string(), // Telegram user ID (not chat ID)
  },
  handler: async (ctx: any, args: any) => {
    try {
      // 1. Get user profile photos
      const response = await fetch(
        `https://api.telegram.org/bot${args.botToken}/getUserProfilePhotos?user_id=${args.userId}&limit=1`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.warn(
          `[Telegram] Failed to get profile photo for user ${args.userId}:`,
          errorData.description
        );
        return null;
      }

      const data = (await response.json()) as {
        ok: boolean;
        result: {
          total_count: number;
          photos: Array<
            Array<{
              file_id: string;
              file_unique_id: string;
              file_size: number;
              width: number;
              height: number;
            }>
          >;
        };
      };

      // Check if user has profile photos
      if (!data.ok || data.result.total_count === 0 || !data.result.photos[0]) {
        return null;
      }

      // Get the largest photo from the first set (photos are grouped by quality)
      const photoSizes = data.result.photos[0];
      const largestPhoto = photoSizes[photoSizes.length - 1];

      if (!largestPhoto) {
        return null;
      }

      // 2. Get file path for the photo
      const fileResponse = await fetch(
        `https://api.telegram.org/bot${args.botToken}/getFile?file_id=${largestPhoto.file_id}`
      );

      if (!fileResponse.ok) {
        return null;
      }

      const fileData = (await fileResponse.json()) as {
        ok: boolean;
        result: {
          file_id: string;
          file_unique_id: string;
          file_size: number;
          file_path: string;
        };
      };

      if (!fileData.ok || !fileData.result.file_path) {
        return null;
      }

      // 3. Construct the full URL to the photo
      const photoUrl = `https://api.telegram.org/file/bot${args.botToken}/${fileData.result.file_path}`;

      return photoUrl;
    } catch (error) {
      console.error(`[Telegram] Error getting profile photo:`, error);
      return null;
    }
  },
});
