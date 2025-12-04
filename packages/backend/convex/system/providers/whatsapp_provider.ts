import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../../_generated/api";
import {
  ensureActiveConnection,
  getRequiredCredential,
  getRequiredMetadata,
  formatProviderError,
} from "./_helpers";

/**
 * Send message via WhatsApp through Meta Graph API
 *
 * Called by system/channels.ts:sendMessageToChannel() when:
 * - A message arrives from WhatsApp webhook
 * - AI generates a response
 * - We need to send it back to the user
 */
export const sendMessage = internalAction({
  args: {
    channel: v.literal("whatsapp"),
    channelUserId: v.string(),  // "+5511999999999" (with or without +)
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // 1. Get WhatsApp connection from channelConnections (agnostic)
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnection,
        {
          organizationId: args.organizationId,
          channel: "whatsapp",
        }
      );

      // Validate connection is active
      ensureActiveConnection(connection, "WhatsApp");

      // 2. Extract credentials and metadata
      const accessToken = getRequiredCredential(
        connection.credentials,
        "accessToken",
        "WhatsApp"
      );
      const phoneNumberId = getRequiredMetadata(
        connection.channelMetadata,
        "phoneNumberId",
        "WhatsApp"
      );

      // 3. Normalize phone number (remove special characters, add country code if needed)
      const phoneNumber = normalizePhoneNumber(args.channelUserId);

      // 4. Send message via Meta Graph API
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "text",
            text: {
              preview_url: false,
              body: args.messageText,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = JSON.stringify(errorData);

        // Log error for debugging
        console.error(
          `[WhatsApp] Failed to send message to ${phoneNumber}:`,
          errorMessage
        );

        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Meta Graph API error: ${errorMessage}`,
        });
      }

      const responseData = (await response.json()) as {
        messages?: Array<{ id: string }>;
        contacts?: Array<{ input: string; wa_id: string }>;
      };

      // 5. Return success with message ID
      const messageId =
        responseData.messages?.[0]?.id ||
        responseData.contacts?.[0]?.wa_id ||
        "unknown";

      return {
        success: true,
        messageId,
        phoneNumber,
      };
    } catch (error) {
      // If it's already a ConvexError, rethrow it
      if (error instanceof ConvexError) {
        throw error;
      }

      // Otherwise wrap it
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("WhatsApp", "sendMessage", error),
      });
    }
  },
});

/**
 * Helper: Normalize phone number for Meta Graph API
 *
 * Meta expects: digits only (no +, -, spaces, etc)
 * Input examples:
 *   "+5511999999999" → "5511999999999"
 *   "5511999999999" → "5511999999999"
 *   "+55 11 9 9999-9999" → "5511999999999"
 *
 * Note: If user ID is already just the number from webhook,
 * this will just clean it up
 */
function normalizePhoneNumber(input: string): string {
  // Remove all non-digit characters
  const cleaned = input.replace(/\D/g, "");

  if (!cleaned) {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: "Invalid phone number format",
    });
  }

  return cleaned;
}

/**
 * Helper: Format phone number for display
 *
 * Takes normalized number and makes it readable
 * "5511999999999" → "+55 11 99999-9999"
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.length === 13) {
    // Format: +55 11 99999-9999
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(
      4,
      9
    )}-${cleaned.slice(9)}`;
  }

  // Fallback: just add + prefix
  return `+${cleaned}`;
}
