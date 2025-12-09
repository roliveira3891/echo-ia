import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "../../_generated/api";
import {
  ensureActiveConnection,
  getRequiredCredential,
  getRequiredMetadata,
  formatProviderError,
} from "./_helpers";

// Get Evolution API configuration from environment variables
const getEvolutionConfig = () => {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new ConvexError({
      code: "INTERNAL_ERROR",
      message: "Evolution API configuration missing. Please set EVOLUTION_API_URL and EVOLUTION_API_KEY environment variables.",
    });
  }

  return { apiUrl, apiKey };
};

/**
 * Send message via Evolution API
 *
 * Called by system/channels.ts:sendMessageToChannel() when:
 * - A message arrives from Evolution webhook
 * - AI generates a response
 * - We need to send it back to the user
 */
export const sendMessage = internalAction({
  args: {
    channel: v.literal("evolution"),
    channelUserId: v.string(), // WhatsApp number (e.g., "5511999999999")
    messageText: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // 1. Get Evolution connection from channelConnections (agnostic)
      const connection = await ctx.runQuery(
        internal.system.channelConnections.getActiveConnection,
        {
          organizationId: args.organizationId,
          channel: "evolution",
        }
      );

      // Validate connection is active
      ensureActiveConnection(connection, "Evolution API");

      // 2. Get Evolution API configuration
      const { apiUrl, apiKey } = getEvolutionConfig();

      // 3. Extract instance name from metadata
      const instanceName = getRequiredMetadata(
        connection.channelMetadata,
        "instanceName",
        "Evolution API"
      );

      // 4. Send message via Evolution API
      const response = await fetch(
        `${apiUrl}/message/sendText/${instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          body: JSON.stringify({
            number: args.channelUserId,
            text: args.messageText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();

        console.error(
          `[Evolution API] Failed to send message to ${args.channelUserId}:`,
          errorData
        );

        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Evolution API error: ${errorData}`,
        });
      }

      const responseData = await response.json();

      // 5. Return success with message ID
      const messageId = responseData.key?.id || "unknown";

      return {
        success: true,
        messageId,
        number: args.channelUserId,
      };
    } catch (error) {
      // If it's already a ConvexError, rethrow it
      if (error instanceof ConvexError) {
        throw error;
      }

      // Otherwise wrap it
      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Evolution API", "sendMessage", error),
      });
    }
  },
});

/**
 * Create instance in Evolution API
 * Used during connection setup to create a new WhatsApp instance
 */
export const createInstance = internalAction({
  args: {
    instanceName: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const { apiUrl, apiKey } = getEvolutionConfig();

      const response = await fetch(
        `${apiUrl}/instance/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          body: JSON.stringify({
            instanceName: args.instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: `Failed to create instance: ${errorData}`,
        });
      }

      const data = await response.json();

      return {
        success: true,
        instanceName: args.instanceName,
        data,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Evolution API", "createInstance", error),
      });
    }
  },
});

/**
 * Get QR Code for WhatsApp connection
 * Returns base64 QR code image
 */
export const getQRCode = internalAction({
  args: {
    instanceName: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const { apiUrl, apiKey } = getEvolutionConfig();

      // Wait a bit for instance to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      let qrcode = null;
      let pairingCode = null;

      // Try to get QR code - first attempt with connect endpoint
      const connectResponse = await fetch(
        `${apiUrl}/instance/connect/${args.instanceName}`,
        {
          method: "GET",
          headers: {
            "apikey": apiKey,
          },
        }
      );

      if (connectResponse.ok) {
        const connectData = await connectResponse.json();
        console.log("[Evolution API] Connect response:", JSON.stringify(connectData));

        // Try to extract QR code from connect response
        if (connectData.base64) {
          qrcode = connectData.base64;
        } else if (connectData.qrcode?.base64) {
          qrcode = connectData.qrcode.base64;
        } else if (typeof connectData.qrcode === 'string') {
          qrcode = connectData.qrcode;
        } else if (connectData.qr) {
          qrcode = connectData.qr;
        }

        // Extract pairing code
        if (connectData.code) {
          pairingCode = connectData.code;
        } else if (connectData.pairingCode) {
          pairingCode = connectData.pairingCode;
        }
      }

      // If we got QR code from first request, return it
      if (qrcode) {
        console.log("[Evolution API] QR code found in connect response");
        return {
          success: true,
          qrcode,
          pairingCode,
        };
      }

      // Wait a bit more for QR to be generated
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Now try to fetch the QR code from fetchInstances endpoint
      const fetchResponse = await fetch(
        `${apiUrl}/instance/fetchInstances?instanceName=${args.instanceName}`,
        {
          method: "GET",
          headers: {
            "apikey": apiKey,
          },
        }
      );

      if (fetchResponse.ok) {
        const instances = await fetchResponse.json();
        console.log("[Evolution API] Fetch instances response:", JSON.stringify(instances));

        // Find our instance in the response
        const instance = Array.isArray(instances)
          ? instances.find((i: any) => i.name === args.instanceName)
          : instances;

        if (instance) {
          // Try different possible QR code locations
          if (instance.qrcode?.base64) {
            qrcode = instance.qrcode.base64;
          } else if (instance.qrcode?.code) {
            qrcode = instance.qrcode.code;
          } else if (instance.qr) {
            qrcode = instance.qr;
          }

          // Extract pairing code
          if (instance.qrcode?.pairingCode) {
            pairingCode = instance.qrcode.pairingCode;
          } else if (instance.pairingCode) {
            pairingCode = instance.pairingCode;
          }
        }
      }

      // If still no QR code, try connectionState endpoint
      if (!qrcode) {
        const stateResponse = await fetch(
          `${apiUrl}/instance/connectionState/${args.instanceName}`,
          {
            method: "GET",
            headers: {
              "apikey": apiKey,
            },
          }
        );

        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          console.log("[Evolution API] Connection state response:", JSON.stringify(stateData));

          if (stateData.qrcode?.base64) {
            qrcode = stateData.qrcode.base64;
          } else if (stateData.qrcode) {
            qrcode = stateData.qrcode;
          }
          if (stateData.pairingCode) {
            pairingCode = stateData.pairingCode;
          }
        }
      }

      // Remove ALL data URI prefixes - keep ONLY the base64 string
      // Find the LAST occurrence of "base64," and get everything after it
      if (qrcode && qrcode.includes("base64,")) {
        const lastIndex = qrcode.lastIndexOf("base64,");
        qrcode = qrcode.substring(lastIndex + "base64,".length);
      }

      return {
        success: true,
        qrcode,
        pairingCode,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Evolution API", "getQRCode", error),
      });
    }
  },
});

/**
 * Get instance connection status
 * Check if instance is connected to WhatsApp
 */
export const getInstanceStatus = internalAction({
  args: {
    instanceName: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const { apiUrl, apiKey } = getEvolutionConfig();

      const response = await fetch(
        `${apiUrl}/instance/connectionState/${args.instanceName}`,
        {
          method: "GET",
          headers: {
            "apikey": apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();

        // If instance doesn't exist (404), return a specific state instead of throwing
        if (response.status === 404) {
          console.warn(`[Evolution API] Instance ${args.instanceName} not found (404)`);
          return {
            success: false,
            state: "not_found",
            error: "Instance does not exist",
          };
        }

        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Failed to get instance status: ${errorData}`,
        });
      }

      const data = await response.json();

      return {
        success: true,
        state: data.state,
        instance: data.instance,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Evolution API", "getInstanceStatus", error),
      });
    }
  },
});

/**
 * Delete instance from Evolution API
 * Called when disconnecting to remove the WhatsApp instance
 */
export const deleteInstance = internalAction({
  args: {
    instanceName: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const { apiUrl, apiKey } = getEvolutionConfig();

      const response = await fetch(
        `${apiUrl}/instance/delete/${args.instanceName}`,
        {
          method: "DELETE",
          headers: {
            "apikey": apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Failed to delete instance: ${errorData}`,
        });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Evolution API", "deleteInstance", error),
      });
    }
  },
});

/**
 * Set webhook URL for Evolution instance
 * Called after successful connection to start receiving messages
 */
export const setWebhook = internalAction({
  args: {
    instanceName: v.string(),
    webhookUrl: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    try {
      const { apiUrl, apiKey } = getEvolutionConfig();

      const response = await fetch(
        `${apiUrl}/webhook/set/${args.instanceName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: args.webhookUrl,
              webhookByEvents: false,
              webhookBase64: false,
              events: [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "CONNECTION_UPDATE",
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new ConvexError({
          code: "EXTERNAL_ERROR",
          message: `Failed to set webhook: ${errorData}`,
        });
      }

      const data = await response.json();

      return {
        success: true,
        webhook: data,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        code: "INTERNAL_ERROR",
        message: formatProviderError("Evolution API", "setWebhook", error),
      });
    }
  },
});
