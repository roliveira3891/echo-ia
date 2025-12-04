import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get WhatsApp connection by phone number ID
 * Used internally by webhooks to find organization from incoming messages
 *
 * This is a temporary helper that searches channelConnections
 * for WhatsApp accounts by phoneNumberId in channelMetadata
 */
export const getAccountByPhoneNumberId = internalQuery({
  args: {
    phoneNumberId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all WhatsApp connections
    const connections = await ctx.db
      .query("channelConnections")
      .withIndex("by_channel")
      .filter((q) => q.eq(q.field("channel"), "whatsapp"))
      .collect();

    // Find the one with matching phoneNumberId in metadata
    const connection = connections.find(
      (conn) => conn.channelMetadata?.phoneNumberId === args.phoneNumberId
    );

    if (!connection) {
      return null;
    }

    // Return in format compatible with old whatsappAccounts structure
    // for backward compatibility with webhook handler
    return {
      organizationId: connection.organizationId,
      phoneNumberId: connection.channelMetadata.phoneNumberId,
      phoneNumber: connection.channelMetadata.phoneNumber,
      webhookToken: connection.credentials.webhookToken,
      isActive: connection.status === "connected",
      accessToken: connection.credentials.accessToken,
      whatsappBusinessAccountId: connection.channelMetadata.wabaId,
      connectedAt: connection.connectedAt,
      metaUserId: connection.channelMetadata.metaUserId,
    };
  },
});
