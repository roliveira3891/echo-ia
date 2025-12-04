import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal query: Get connection by channel account ID
 * Used by webhooks to find the organization from incoming messages
 *
 * Example: WhatsApp webhook receives message from phone_number_id
 * const connection = await getConnectionByChannelAccountId({
 *   channel: "whatsapp",
 *   channelAccountId: "123456789"
 * })
 */
export const getConnectionByChannelAccountId = internalQuery({
  args: {
    channel: v.string(),
    channelAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channelConnections")
      .withIndex("by_channel_account_id")
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .filter((q) => q.eq(q.field("channelAccountId"), args.channelAccountId))
      .first();
  },
});

/**
 * Internal query: Get active connection for organization + channel
 * Used by providers to get credentials for sending messages
 * Includes sensitive credentials (only for internal use)
 *
 * Example: Send WhatsApp message
 * const connection = await getActiveConnection({
 *   organizationId: "org_123",
 *   channel: "whatsapp"
 * })
 * // Use connection.credentials.accessToken to call Meta Graph API
 */
export const getActiveConnection = internalQuery({
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

    if (!connection || connection.status !== "connected") {
      return null;
    }

    return connection;
  },
});

/**
 * Internal mutation: Upsert (create or update) channel connection
 * Used by OAuth handlers to save connection after successful authorization
 *
 * Example: Save WhatsApp connection after Meta OAuth
 * await upsertConnection({
 *   organizationId: "org_123",
 *   channel: "whatsapp",
 *   channelAccountId: "+5511999999999",
 *   credentials: { accessToken: "xxx", webhookToken: "yyy" },
 *   channelMetadata: { phoneNumberId: "123", wabaId: "456" },
 *   status: "connected"
 * })
 */
export const upsertConnection = internalMutation({
  args: {
    organizationId: v.string(),
    channel: v.string(),
    channelAccountId: v.string(),
    credentials: v.object({
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      apiKey: v.optional(v.string()),
      apiSecret: v.optional(v.string()),
      webhookToken: v.optional(v.string()),
      webhookSecret: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
    channelMetadata: v.any(),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("pending")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if connection already exists
    const existing = await ctx.db
      .query("channelConnections")
      .withIndex("by_org_and_channel")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .filter((q) => q.eq(q.field("channel"), args.channel))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        channelAccountId: args.channelAccountId,
        credentials: args.credentials,
        channelMetadata: args.channelMetadata,
        status: args.status,
        lastSyncAt: Date.now(),
        errorMessage: args.errorMessage,
      });
      return existing._id;
    } else {
      // Create new connection
      return await ctx.db.insert("channelConnections", {
        organizationId: args.organizationId,
        channel: args.channel,
        channelAccountId: args.channelAccountId,
        credentials: args.credentials,
        channelMetadata: args.channelMetadata,
        status: args.status,
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
        errorMessage: args.errorMessage,
      });
    }
  },
});

/**
 * Internal mutation: Disconnect channel
 * Marks connection as disconnected instead of deleting (for audit trail)
 *
 * Example: User disconnects WhatsApp
 * await disconnectChannel({ organizationId: "org_123", channel: "whatsapp" })
 */
export const disconnectChannel = internalMutation({
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
      throw new Error(`Connection not found for ${args.channel}`);
    }

    await ctx.db.patch(connection._id, {
      status: "disconnected",
      lastSyncAt: Date.now(),
    });

    return { success: true };
  },
});
