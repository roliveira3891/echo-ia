import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get WhatsApp account by phone number ID
 * Used internally by webhooks
 */
export const getAccountByPhoneNumberId = internalQuery({
  args: {
    phoneNumberId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whatsappAccounts")
      .withIndex("by_phone_number_id")
      .filter((q) => q.eq(q.field("phoneNumberId"), args.phoneNumberId))
      .first();
  },
});
