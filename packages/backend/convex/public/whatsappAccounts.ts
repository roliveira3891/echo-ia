import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get WhatsApp account info for a specific organization
 * Used by frontend to display connection status
 *
 * DEPRECATED: This is a compatibility wrapper
 * Frontend should migrate to use api.public.channelConnections.getConnection
 */
export const getAccount = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get WhatsApp connection from channelConnections
    const connection = await ctx.db
      .query("channelConnections")
      .withIndex("by_org_and_channel")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("channel"), "whatsapp"))
      .first();

    if (!connection) {
      return null;
    }

    // Return in format compatible with old whatsappAccounts structure
    // for backward compatibility with frontend
    return {
      organizationId: connection.organizationId,
      phoneNumber: connection.channelMetadata?.phoneNumber || connection.channelAccountId,
      isActive: connection.status === "connected",
      connectedAt: connection.connectedAt,
      verifiedName: connection.channelMetadata?.verifiedName || connection.channelMetadata?.wabaName,
    };
  },
});
