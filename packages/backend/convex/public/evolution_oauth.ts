import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Public action: Connect Evolution API instance
 * Called from frontend when user initiates connection
 * Instance name and API key are managed internally
 */
export const connect = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runAction(internal.system.providers.evolution_oauth.connect, {
      organizationId: args.organizationId,
    });
  },
});

/**
 * Public action: Check connection status
 * Called from frontend to poll connection status
 */
export const checkConnectionStatus = action({
  args: {
    organizationId: v.string(),
    instanceName: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runAction(
      internal.system.providers.evolution_oauth.checkConnectionStatus,
      {
        organizationId: args.organizationId,
        instanceName: args.instanceName,
      }
    );
  },
});

/**
 * Public action: Disconnect Evolution API instance
 * Called from frontend when user disconnects
 */
export const disconnect = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runAction(internal.system.providers.evolution_oauth.disconnect, {
      organizationId: args.organizationId,
    });
  },
});
