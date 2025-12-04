import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get channel connection for a specific organization and channel
 * Used by frontend to display connection status
 *
 * Example: Get WhatsApp connection status
 * const whatsapp = await getConnection({ organizationId: "org_123", channel: "whatsapp" })
 */
export const getConnection = query({
  args: {
    organizationId: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("channelConnections")
      .withIndex("by_org_and_channel")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .first();

    if (!connection) {
      return null;
    }

    // Don't expose sensitive credentials in public queries
    return {
      _id: connection._id,
      organizationId: connection.organizationId,
      channel: connection.channel,
      channelAccountId: connection.channelAccountId,
      channelMetadata: connection.channelMetadata,
      status: connection.status,
      connectedAt: connection.connectedAt,
      lastSyncAt: connection.lastSyncAt,
      errorMessage: connection.errorMessage,
    };
  },
});

/**
 * List all channel connections for an organization
 * Used by frontend to show all connected channels
 *
 * Example: Show all integrations in dashboard
 * const connections = await listConnections({ organizationId: "org_123" })
 * // Returns: [{ channel: "whatsapp", status: "connected" }, { channel: "telegram", status: "connected" }]
 */
export const listConnections = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("channelConnections")
      .withIndex("by_organization_id")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .collect();

    // Don't expose sensitive credentials
    return connections.map((connection) => ({
      _id: connection._id,
      organizationId: connection.organizationId,
      channel: connection.channel,
      channelAccountId: connection.channelAccountId,
      channelMetadata: connection.channelMetadata,
      status: connection.status,
      connectedAt: connection.connectedAt,
      lastSyncAt: connection.lastSyncAt,
      errorMessage: connection.errorMessage,
    }));
  },
});
