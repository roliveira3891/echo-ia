/**
 * Provider Helpers
 *
 * Utility functions to work with channel providers in an agnostic way
 */

import { ConvexError } from "convex/values";

/**
 * Channel type definitions
 */
export type Channel =
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "tiktok"
  | "facebook_messenger"
  | "linkedin";

/**
 * Credentials structure (flexible for any channel)
 */
export interface ChannelCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookToken?: string;
  webhookSecret?: string;
  expiresAt?: number;
}

/**
 * Connection structure
 */
export interface ChannelConnection {
  _id: any;
  organizationId: string;
  channel: string;
  channelAccountId: string;
  credentials: ChannelCredentials;
  channelMetadata: any;
  status: "connected" | "disconnected" | "error" | "pending";
  connectedAt: number;
  lastSyncAt?: number;
  errorMessage?: string;
}

/**
 * Helper: Ensure connection is active
 * Throws ConvexError if connection is not found or not active
 */
export function ensureActiveConnection(
  connection: ChannelConnection | null,
  channel: string
): asserts connection is ChannelConnection {
  if (!connection) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: `${channel} connection not found for this organization`,
    });
  }

  if (connection.status !== "connected") {
    throw new ConvexError({
      code: "BAD_REQUEST",
      message: `${channel} connection is not active (status: ${connection.status})`,
    });
  }
}

/**
 * Helper: Get required credential field
 * Throws ConvexError if field is missing
 */
export function getRequiredCredential(
  credentials: ChannelCredentials,
  field: keyof ChannelCredentials,
  channel: string
): string {
  const value = credentials[field];

  if (!value || typeof value !== "string") {
    throw new ConvexError({
      code: "INTERNAL_ERROR",
      message: `Missing required ${field} for ${channel}`,
    });
  }

  return value;
}

/**
 * Helper: Get required metadata field
 * Throws ConvexError if field is missing
 */
export function getRequiredMetadata(
  metadata: any,
  field: string,
  channel: string
): any {
  const value = metadata?.[field];

  if (!value) {
    throw new ConvexError({
      code: "INTERNAL_ERROR",
      message: `Missing required metadata field '${field}' for ${channel}`,
    });
  }

  return value;
}

/**
 * Helper: Generate secure random token
 * Used for webhook tokens
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Helper: Check if credential is expired
 */
export function isCredentialExpired(credentials: ChannelCredentials): boolean {
  if (!credentials.expiresAt) {
    return false; // No expiry set
  }

  return Date.now() >= credentials.expiresAt;
}

/**
 * Helper: Format error message for ConvexError
 */
export function formatProviderError(
  channel: string,
  operation: string,
  error: unknown
): string {
  if (error instanceof Error) {
    return `[${channel}] ${operation} failed: ${error.message}`;
  }
  return `[${channel}] ${operation} failed: ${String(error)}`;
}
