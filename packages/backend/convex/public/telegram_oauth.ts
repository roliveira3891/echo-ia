import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Public action: Connect Telegram bot
 * Called from frontend when user submits bot token
 */
export const connect = action({
  args: {
    organizationId: v.string(),
    botToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.system.providers.telegram_oauth.connect, {
      organizationId: args.organizationId,
      botToken: args.botToken,
    });
  },
});

/**
 * Public action: Disconnect Telegram bot
 * Called from frontend when user disconnects
 */
export const disconnect = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.system.providers.telegram_oauth.disconnect, {
      organizationId: args.organizationId,
    });
  },
});
