import { Webhook } from "svix";
import { createClerkClient } from "@clerk/backend";
import type { WebhookEvent } from "@clerk/backend";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);

    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }

    switch (event.type) {
      case "subscription.updated": {
        const subscription = event.data as {
          status: string;
          payer?: {
            organization_id: string;
          }
        };

        const organizationId = subscription.payer?.organization_id;

        if (!organizationId) {
          return new Response("Missing Organization ID", { status: 400 });
        }

        const newMaxAllowedMemberships = subscription.status === "active" ? 5 : 1;

        await clerkClient.organizations.updateOrganization(organizationId, {
          maxAllowedMemberships: newMaxAllowedMemberships,
        });

        await ctx.runMutation(internal.system.subscriptions.upsert, {
          organizationId,
          status: subscription.status,
        });

        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id") || "",
    "svix-timestamp": req.headers.get("svix-timestamp") || "",
    "svix-signature": req.headers.get("svix-signature") || "",
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error(`Error verifying webhook event`, error);
    return null;
  }
};

/**
 * WhatsApp OAuth Callback Handler
 * Called by Meta after user authorizes via OAuth
 * Path: /webhooks/whatsapp/callback?code=XXX&state=org_123
 */
http.route({
  path: "/webhooks/whatsapp/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        return new Response("Missing code or state parameter", { status: 400 });
      }

      // Call the OAuth handler action
      const result = await ctx.runAction(
        internal.system.providers.whatsapp_oauth.handleCallback,
        {
          code,
          state,
        }
      );

      // Redirect to dashboard with success message
      const dashboardUrl = new URL(process.env.APP_URL || "http://localhost:3000");
      dashboardUrl.pathname = `/${state}/integrations`;
      dashboardUrl.searchParams.set("whatsapp", "connected");

      return new Response(null, {
        status: 302,
        headers: {
          Location: dashboardUrl.toString(),
        },
      });
    } catch (error) {
      console.error("[WhatsApp OAuth Callback] Error:", error);

      // Redirect to integrations page with error
      const errorUrl = new URL(process.env.APP_URL || "http://localhost:3000");
      errorUrl.pathname = "/integrations";
      errorUrl.searchParams.set("whatsapp_error", String(error));

      return new Response(null, {
        status: 302,
        headers: {
          Location: errorUrl.toString(),
        },
      });
    }
  }),
});

/**
 * WhatsApp Webhook Handler
 * Receives incoming messages and status updates from Meta
 * Path: /webhooks/whatsapp?hub.verify_token=...
 */
http.route({
  path: "/webhooks/whatsapp",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      // Webhook subscription verification from Meta
      if (mode === "subscribe" && challenge) {
        // Note: Meta sends a generic verify_token in subscription.
        // We return the challenge to confirm subscription, then validate
        // actual webhook messages with organization-specific tokens.
        if (token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        } else {
          return new Response("Forbidden", { status: 403 });
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[WhatsApp Webhook GET] Error:", error);
      return new Response("Error", { status: 500 });
    }
  }),
});

/**
 * WhatsApp Webhook Handler (POST)
 * Receives incoming messages and status updates from Meta
 */
http.route({
  path: "/webhooks/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const data = JSON.parse(body) as {
        entry?: Array<{
          changes?: Array<{
            value?: {
              metadata?: {
                phone_number_id: string;
              };
              messages?: Array<{
                from: string;
                id: string;
                timestamp: string;
                type: string;
                text?: {
                  body: string;
                };
              }>;
              statuses?: Array<{
                id: string;
                status: string;
              }>;
            };
          }>;
        }>;
      };

      // Extract webhook data
      const change = data.entry?.[0]?.changes?.[0];
      if (!change || !change.value) {
        return new Response("OK", { status: 200 }); // Silent ignore invalid format
      }

      const metadata = change.value.metadata;
      const phoneNumberId = metadata?.phone_number_id;

      if (!phoneNumberId) {
        return new Response("Missing phone_number_id", { status: 400 });
      }

      // Find the WhatsApp account by phone_number_id
      const whatsappAccount = await ctx.runQuery(
        internal.system.whatsapp.getAccountByPhoneNumberId,
        { phoneNumberId }
      );

      if (!whatsappAccount) {
        console.warn(`[WhatsApp Webhook] No account found for phone_number_id: ${phoneNumberId}`);
        return new Response("Account not found", { status: 404 });
      }

      // Validate webhook token
      const token = new URL(request.url).searchParams.get("hub.verify_token");
      if (token && token !== whatsappAccount.webhookToken) {
        console.warn(`[WhatsApp Webhook] Invalid webhook token for org: ${whatsappAccount.organizationId}`);
        return new Response("Unauthorized", { status: 401 });
      }

      // Handle incoming message
      const messages = change.value.messages;
      if (messages && messages.length > 0) {
        const message = messages[0];

        if (message && message.type === "text" && message.text?.body) {
          // Process incoming message through the channel handler
          await ctx.scheduler.runAfter(0, internal.system.channels.handleIncomingMessage, {
            channel: "whatsapp",
            organizationId: whatsappAccount.organizationId,
            channelUserId: `+${message.from}`, // Meta doesn't include +, we add it
            messageText: message.text.body,
            externalMessageId: message.id,
          });
        }
      }

      // Handle status updates (optional: could log delivery/read status)
      const statuses = change.value.statuses;
      if (statuses && statuses.length > 0 && statuses[0]) {
        // Could log status changes here: sent, delivered, read, failed
        // For now, we just acknowledge
        console.log(
          `[WhatsApp Webhook] Status update:`,
          statuses[0].status
        );
      }

      // Always return 200 OK to Meta (acknowledge receipt)
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[WhatsApp Webhook POST] Error:", error);
      // Still return 200 to prevent Meta from retrying
      return new Response("OK", { status: 200 });
    }
  }),
});

/**
 * Telegram Webhook Handler (GET)
 * Used for health checks and debugging
 * Path: /webhooks/telegram?token=XXX
 */
http.route({
  path: "/webhooks/telegram",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Missing token parameter",
            hint: "Add ?token=YOUR_TOKEN to the URL"
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Verify token exists
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getConnectionByWebhookToken,
        {
          channel: "telegram",
          webhookToken: token,
        }
      );

      if (!connection) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Invalid webhook token",
            token: token
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Telegram webhook endpoint is active",
          organizationId: connection.organizationId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("[Telegram Webhook GET] Error:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Internal server error",
          error: String(error)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

/**
 * Telegram Webhook Handler (POST)
 * Receives incoming messages from Telegram Bot API
 * Path: /webhooks/telegram?token=XXX
 */
http.route({
  path: "/webhooks/telegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }

      const body = await request.text();
      const data = JSON.parse(body) as {
        update_id: number;
        message?: {
          message_id: number;
          from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
          };
          chat: {
            id: number;
            type: string;
            username?: string;
            first_name?: string;
          };
          date: number;
          text?: string;
        };
        edited_message?: {
          message_id: number;
          from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
          };
          chat: {
            id: number;
            type: string;
          };
          date: number;
          text?: string;
        };
      };

      // Handle regular messages
      const message = data.message || data.edited_message;

      if (!message || !message.text) {
        // Ignore non-text messages or messages without text
        return new Response("OK", { status: 200 });
      }

      // Ignore messages from bots
      if (message.from.is_bot) {
        return new Response("OK", { status: 200 });
      }

      // Find connection by webhook token
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getConnectionByWebhookToken,
        {
          channel: "telegram",
          webhookToken: token,
        }
      );

      if (!connection) {
        console.warn(`[Telegram Webhook] No connection found for token: ${token}`);
        return new Response("Unauthorized", { status: 401 });
      }

      const organizationId = connection.organizationId;

      // Process incoming message through the channel handler
      await ctx.scheduler.runAfter(0, internal.system.channels.handleIncomingMessage, {
        channel: "telegram",
        organizationId,
        channelUserId: message.chat.id.toString(),
        messageText: message.text,
        externalMessageId: message.message_id.toString(),
      });

      // Always return 200 OK to Telegram
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[Telegram Webhook] Error:", error);
      // Still return 200 to prevent Telegram from retrying
      return new Response("OK", { status: 200 });
    }
  }),
});

/**
 * Evolution API Webhook Handler (POST)
 * Receives incoming messages and connection updates from Evolution API
 * Path: /webhooks/evolution?token=XXX&instance=YYY
 */
http.route({
  path: "/webhooks/evolution",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      const instanceName = url.searchParams.get("instance");

      if (!token || !instanceName) {
        return new Response("Missing token or instance parameter", { status: 401 });
      }

      const body = await request.text();
      const data = JSON.parse(body) as {
        event: string;
        instance: string;
        data?: any;
      };

      // Find connection by webhook token
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getConnectionByWebhookToken,
        {
          channel: "evolution",
          webhookToken: token,
        }
      );

      if (!connection) {
        console.warn(`[Evolution Webhook] No connection found for token: ${token}`);
        return new Response("Unauthorized", { status: 401 });
      }

      const organizationId = connection.organizationId;

      // Handle different event types
      switch (data.event) {
        case "messages.upsert":
        case "MESSAGES_UPSERT": {
          // Handle incoming message
          const message = data.data?.messages?.[0] || data.data;

          if (!message) {
            return new Response("OK", { status: 200 });
          }

          // Extract message data
          const key = message.key || {};
          const messageData = message.message || {};

          // Only process messages from users (not from bot)
          if (key.fromMe) {
            return new Response("OK", { status: 200 });
          }

          // Get text content
          let messageText = "";
          if (messageData.conversation) {
            messageText = messageData.conversation;
          } else if (messageData.extendedTextMessage?.text) {
            messageText = messageData.extendedTextMessage.text;
          }

          if (!messageText) {
            return new Response("OK", { status: 200 });
          }

          // Extract sender number (remoteJid)
          const channelUserId = key.remoteJid?.replace("@s.whatsapp.net", "") || "";

          if (!channelUserId) {
            return new Response("OK", { status: 200 });
          }

          // Process incoming message through the channel handler
          await ctx.scheduler.runAfter(0, internal.system.channels.handleIncomingMessage, {
            channel: "evolution",
            organizationId,
            channelUserId,
            messageText,
            externalMessageId: key.id || "unknown",
          });

          break;
        }

        case "connection.update":
        case "CONNECTION_UPDATE": {
          // Handle connection status update
          const connectionData = data.data;
          const state = connectionData?.state || connectionData?.connection;

          if (state) {
            await ctx.runAction(
              internal.system.providers.evolution_oauth.updateConnectionStatus,
              {
                organizationId,
                instanceName,
                state,
                instanceData: connectionData,
              }
            );
          }

          break;
        }

        default:
          console.log(`[Evolution Webhook] Ignored event: ${data.event}`);
      }

      // Always return 200 OK
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[Evolution Webhook] Error:", error);
      // Still return 200 to prevent Evolution from retrying
      return new Response("OK", { status: 200 });
    }
  }),
});

export default http;
