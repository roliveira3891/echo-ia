import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get WhatsApp account info for a specific organization
 * Used by frontend to display connection status
 */
export const getAccount = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("whatsappAccounts")
      .withIndex("by_organization_id")
      .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
      .first();

    if (!account) {
      return null;
    }

    // Don't expose access token in queries (should be stored securely)
    return {
      organizationId: account.organizationId,
      phoneNumber: account.phoneNumber,
      isActive: account.isActive,
      connectedAt: account.connectedAt,
      verifiedName: account.whatsappBusinessAccountId,
    };
  },
});
