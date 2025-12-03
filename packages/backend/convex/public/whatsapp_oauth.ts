import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Generate Meta OAuth authorization URL
 * Called by frontend to initiate WhatsApp connection
 */
export const getAuthorizationUrl = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;

    if (!appId || !redirectUri) {
      throw new Error("META_APP_ID or META_REDIRECT_URI not configured");
    }

    const scope = [
      "whatsapp_business_messaging",
      "whatsapp_business_account_management",
    ].join(",");

    const url = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scope);
    url.searchParams.set("state", args.organizationId);

    return { authorizationUrl: url.toString() };
  },
});

/**
 * Disconnect WhatsApp account
 * Called by frontend to deactivate connection
 */
export const disconnect = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    return await ctx.runAction(
      internal.system.providers.whatsapp_oauth.disconnect,
      {
        organizationId: args.organizationId,
      }
    );
  },
});
