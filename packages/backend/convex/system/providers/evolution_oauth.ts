import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../../_generated/api";
import { generateSecureToken } from "./_helpers";

/**
 * Generate unique instance name for organization
 * Format: org_<orgId>_<timestamp>
 */
function generateInstanceName(organizationId: string): string {
  // Remove 'org_' prefix if exists and take first 8 chars
  const orgShort = organizationId.replace("org_", "").substring(0, 8);
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `org_${orgShort}_${timestamp}`;
}

/**
 * Connect Evolution API instance
 * Creates instance, generates QR code, and saves connection
 *
 * Called from frontend when user initiates connection
 */
export const connect = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    try {
      // 1. Check if instance already exists for this organization
      const existingConnection = await ctx.runQuery(
        internal.system.channelConnections.getConnectionAnyStatus,
        {
          organizationId: args.organizationId,
          channel: "evolution",
        }
      );

      let instanceName: string;

      // If there's a pending or connected instance, reuse it
      if (existingConnection && (existingConnection.status === "pending" || existingConnection.status === "connected")) {
        instanceName = existingConnection.channelMetadata?.instanceName;

        console.log(`[Evolution OAuth] Reusing existing instance: ${instanceName}`);

        // First check if instance still exists in Evolution API
        const statusCheck: any = await ctx.runAction(
          internal.system.providers.evolution_provider.getInstanceStatus,
          {
            instanceName,
          }
        );

        // If instance doesn't exist in Evolution API, mark as disconnected and create new one
        if (statusCheck.state === "not_found") {
          console.warn(`[Evolution OAuth] Existing instance ${instanceName} not found in Evolution API, will create new one`);

          await ctx.runMutation(internal.system.channelConnections.upsertConnection, {
            organizationId: args.organizationId,
            channel: "evolution",
            channelAccountId: instanceName,
            credentials: existingConnection.credentials,
            channelMetadata: {
              ...existingConnection.channelMetadata,
              error: "Instance not found in Evolution API",
            },
            status: "disconnected",
          });

          // Continue to create new instance below
        } else {
          // Instance exists, get QR Code for it
          const qrCodeResult: any = await ctx.runAction(
            internal.system.providers.evolution_provider.getQRCode,
            {
              instanceName,
            }
          );

          return {
            success: true,
            organizationId: args.organizationId,
            instanceName,
            qrcode: qrCodeResult.qrcode,
            pairingCode: qrCodeResult.pairingCode,
          };
        }
      }

      // If there's a disconnected instance, delete it first
      if (existingConnection && existingConnection.status === "disconnected") {
        const oldInstanceName = existingConnection.channelMetadata?.instanceName;

        console.log(`[Evolution OAuth] Deleting old disconnected instance: ${oldInstanceName}`);

        try {
          await ctx.runAction(
            internal.system.providers.evolution_provider.deleteInstance,
            {
              instanceName: oldInstanceName,
            }
          );
        } catch (err) {
          console.warn(`[Evolution OAuth] Failed to delete old instance (may not exist): ${err}`);
        }
      }

      // 2. Generate unique instance name
      instanceName = generateInstanceName(args.organizationId);

      console.log(`[Evolution OAuth] Creating new instance: ${instanceName}`);

      // 3. Create instance in Evolution API
      const instanceResult: any = await ctx.runAction(
        internal.system.providers.evolution_provider.createInstance,
        {
          instanceName,
        }
      );

      // 4. Generate webhook token for security
      const webhookToken = generateSecureToken();

      // 5. Set up webhook
      const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/webhooks/evolution?token=${webhookToken}&instance=${instanceName}`;

      await ctx.runAction(
        internal.system.providers.evolution_provider.setWebhook,
        {
          instanceName,
          webhookUrl,
        }
      );

      // 6. Save to channelConnections (status: pending until QR code is scanned)
      await ctx.runMutation(internal.system.channelConnections.upsertConnection, {
        organizationId: args.organizationId,
        channel: "evolution",
        channelAccountId: instanceName,
        credentials: {
          webhookToken,
        },
        channelMetadata: {
          instanceName,
          connectionState: "pending",
        },
        status: "pending",
      });

      // 7. Get QR Code
      const qrCodeResult: any = await ctx.runAction(
        internal.system.providers.evolution_provider.getQRCode,
        {
          instanceName,
        }
      );

      return {
        success: true,
        organizationId: args.organizationId,
        instanceName,
        qrcode: qrCodeResult.qrcode,
        pairingCode: qrCodeResult.pairingCode,
      };
    } catch (error) {
      // Log error for debugging
      console.error("[Evolution OAuth] Connection failed:", error);

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: `Failed to connect Evolution API: ${String(error)}`,
      });
    }
  },
});

/**
 * Update connection status
 * Called when webhook receives connection update
 */
export const updateConnectionStatus = internalAction({
  args: {
    organizationId: v.string(),
    instanceName: v.string(),
    state: v.string(),
    instanceData: v.optional(v.any()),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    try {
      // Get existing connection
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnectionByAccountId,
        {
          organizationId: args.organizationId,
          channel: "evolution",
          channelAccountId: args.instanceName,
        }
      );

      if (!connection) {
        console.warn(
          `[Evolution OAuth] Connection not found for instance ${args.instanceName}`
        );
        return { success: false };
      }

      // Map Evolution states to our connection status
      let status: "connected" | "disconnected" | "error" | "pending" = "pending";

      if (args.state === "open" || args.state === "connected") {
        status = "connected";
      } else if (args.state === "close" || args.state === "disconnected") {
        status = "disconnected";
      } else if (args.state === "connecting") {
        status = "pending";
      }

      // Update connection
      await ctx.runMutation(internal.system.channelConnections.upsertConnection, {
        organizationId: args.organizationId,
        channel: "evolution",
        channelAccountId: args.instanceName,
        credentials: connection.credentials,
        channelMetadata: {
          ...connection.channelMetadata,
          connectionState: args.state,
          instanceData: args.instanceData || connection.channelMetadata?.instanceData,
          lastUpdateAt: Date.now(),
        },
        status,
      });

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error("[Evolution OAuth] Failed to update connection status:", error);

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: `Failed to update connection status: ${String(error)}`,
      });
    }
  },
});

/**
 * Check connection status
 * Polls Evolution API to check if QR code was scanned
 */
export const checkConnectionStatus = internalAction({
  args: {
    organizationId: v.string(),
    instanceName: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    try {
      // Get connection - try multiple ways to find it
      let connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnectionByAccountId,
        {
          organizationId: args.organizationId,
          channel: "evolution",
          channelAccountId: args.instanceName,
        }
      );

      // If not found by account ID, try by organization + channel (any status)
      if (!connection) {
        connection = await ctx.runQuery(
          internal.system.channelConnections.getConnectionAnyStatus,
          {
            organizationId: args.organizationId,
            channel: "evolution",
          }
        );
      }

      // If still not found, connection may still be being created
      // Return a pending state instead of throwing error
      if (!connection) {
        console.warn(`[Evolution OAuth] Connection not found yet for ${args.instanceName}, may still be creating...`);
        return {
          success: true,
          state: "pending",
          status: "pending",
        };
      }

      // Check status from Evolution API
      const statusResult: any = await ctx.runAction(
        internal.system.providers.evolution_provider.getInstanceStatus,
        {
          instanceName: args.instanceName,
        }
      );

      // If instance doesn't exist in Evolution API, mark connection as error
      if (statusResult.state === "not_found") {
        console.warn(`[Evolution OAuth] Instance ${args.instanceName} not found in Evolution API, marking as disconnected`);

        await ctx.runMutation(internal.system.channelConnections.upsertConnection, {
          organizationId: args.organizationId,
          channel: "evolution",
          channelAccountId: args.instanceName,
          credentials: connection.credentials,
          channelMetadata: {
            ...connection.channelMetadata,
            error: "Instance not found in Evolution API",
          },
          status: "disconnected",
        });

        return {
          success: false,
          state: "not_found",
          status: "disconnected",
        };
      }

      // Update local connection if state changed
      if (statusResult.state === "open" && connection.status !== "connected") {
        await ctx.runAction(
          internal.system.providers.evolution_oauth.updateConnectionStatus,
          {
            organizationId: args.organizationId,
            instanceName: args.instanceName,
            state: statusResult.state,
            instanceData: statusResult.instance,
          }
        );
      }

      return {
        success: true,
        state: statusResult.state,
        status: connection.status,
      };
    } catch (error) {
      console.error("[Evolution OAuth] Error checking connection status:", error);

      // Don't throw error - just return pending state
      // This prevents the polling from breaking
      return {
        success: false,
        state: "error",
        status: "pending",
        error: String(error),
      };
    }
  },
});

/**
 * Disconnect Evolution API instance
 * Removes webhook and marks connection as disconnected
 */
export const disconnect = internalAction({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    try {
      // 1. Get existing connection
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnection,
        {
          organizationId: args.organizationId,
          channel: "evolution",
        }
      );

      if (!connection) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Evolution API connection not found",
        });
      }

      // 2. Delete instance from Evolution API
      const instanceName = connection.channelMetadata?.instanceName;

      if (instanceName) {
        await ctx.runAction(
          internal.system.providers.evolution_provider.deleteInstance,
          {
            instanceName,
          }
        );
      }

      // 3. Mark as disconnected
      await ctx.runMutation(internal.system.channelConnections.disconnectChannel, {
        organizationId: args.organizationId,
        channel: "evolution",
      });

      return { success: true };
    } catch (error) {
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: `Failed to disconnect Evolution API: ${String(error)}`,
      });
    }
  },
});
