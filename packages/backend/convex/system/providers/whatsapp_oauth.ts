import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

/**
 * Step 2: Handle Meta OAuth callback
 * Meta redirects here with authorization code
 * Called from backend route: /webhooks/whatsapp/callback
 */
export const handleCallback = internalAction({
  args: {
    code: v.string(),
    state: v.string(), // organizationId
  },
  handler: async (ctx: any, args: any) => {
    if (!args.code || !args.state) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Missing code or state parameter",
      });
    }

    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;
    const appId = process.env.META_APP_ID;

    if (!appSecret || !redirectUri || !appId) {
      throw new Error("META configuration not complete");
    }

    try {
      // 1. Exchange authorization code for access token
      const tokenResponse = await fetch(
        "https://graph.instagram.com/v18.0/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirectUri,
            code: args.code,
          }).toString(),
        }
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        token_type: string;
        expires_in?: number;
      };

      // 2. Get WhatsApp Business Account details
      const accountResponse = await fetch(
        `https://graph.instagram.com/v18.0/me/owned_whatsapp_business_accounts?access_token=${tokenData.access_token}`
      );

      if (!accountResponse.ok) {
        throw new Error("Failed to fetch WhatsApp business accounts");
      }

      const accountData = (await accountResponse.json()) as {
        data: Array<{
          id: string;
          name: string;
        }>;
      };

      if (!accountData.data || accountData.data.length === 0) {
        throw new Error("No WhatsApp Business Accounts found");
      }

      const whatsappAccount = accountData.data[0];
      if (!whatsappAccount) {
        throw new Error("WhatsApp account data is invalid");
      }

      // 3. Get phone number details from the WABA
      const phoneResponse = await fetch(
        `https://graph.instagram.com/v18.0/${whatsappAccount.id}/phone_numbers?access_token=${tokenData.access_token}`
      );

      if (!phoneResponse.ok) {
        throw new Error("Failed to fetch phone numbers");
      }

      const phoneData = (await phoneResponse.json()) as {
        data: Array<{
          id: string;
          display_phone_number: string;
          verified_name: string;
        }>;
      };

      if (!phoneData.data || phoneData.data.length === 0) {
        throw new Error("No phone numbers found in WhatsApp Business Account");
      }

      const phoneNumber = phoneData.data[0];
      if (!phoneNumber) {
        throw new Error("Phone number data is invalid");
      }

      // 4. Generate unique webhook token for this organization
      const webhookToken = generateWebhookToken();

      // 5. Get user info for metadata
      const userResponse = await fetch(
        `https://graph.instagram.com/v18.0/me?access_token=${tokenData.access_token}`
      );

      const userData = (await userResponse.json()) as {
        id: string;
        name: string;
      };

      // 6. Check if account already exists
      const existingAccount = await ctx.db
        .query("whatsappAccounts")
        .withIndex("by_organization_id")
        .filter((q: any) => q.eq(q.field("organizationId"), args.state))
        .first();

      if (existingAccount) {
        // Update existing account
        await ctx.db.patch(existingAccount._id, {
          accessToken: tokenData.access_token,
          accessTokenExpiresAt: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          whatsappBusinessAccountId: whatsappAccount.id,
          phoneNumberId: phoneNumber.id,
          phoneNumber: phoneNumber.display_phone_number,
          webhookToken,
          isActive: true,
          connectedAt: Date.now(),
          metaUserId: userData.id,
        });
      } else {
        // Create new account
        await ctx.db.insert("whatsappAccounts", {
          organizationId: args.state,
          accessToken: tokenData.access_token,
          accessTokenExpiresAt: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          whatsappBusinessAccountId: whatsappAccount.id,
          phoneNumberId: phoneNumber.id,
          phoneNumber: phoneNumber.display_phone_number,
          webhookToken,
          isActive: true,
          connectedAt: Date.now(),
          metaUserId: userData.id,
        });
      }

      return {
        success: true,
        organizationId: args.state,
        phoneNumber: phoneNumber.display_phone_number,
        verifiedName: phoneNumber.verified_name,
      };
    } catch (error) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: `OAuth callback failed: ${String(error)}`,
      });
    }
  },
});

/**
 * Disconnect WhatsApp account
 */
export const disconnect = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const account = await ctx.db
      .query("whatsappAccounts")
      .withIndex("by_organization_id")
      .filter((q: any) => q.eq(q.field("organizationId"), args.organizationId))
      .first();

    if (!account) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "WhatsApp account not found",
      });
    }

    // Mark as inactive instead of deleting (for audit trail)
    await ctx.db.patch(account._id, {
      isActive: false,
    });

    return { success: true };
  },
});

/**
 * Helper: Generate a unique webhook token
 * Used to validate incoming webhooks from Meta
 */
function generateWebhookToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
