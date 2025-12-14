import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { eq, and } from "drizzle-orm";
import { decrypt, encrypt } from "./encryption";
import { CacheKeys, cacheGet, cacheSet, cacheDel } from "@/lib/redis";

/**
 * Get authenticated Stripe client for a connected account
 */
export async function getStripeClient(
  organizationId: string,
): Promise<Stripe | null> {
  try {
    // Try cache first
    const cached = await cacheGet<{ accessToken: string }>(
      CacheKeys.stripeConnection(organizationId),
    );

    let accessToken: string;

    if (cached) {
      accessToken = cached.accessToken;
    } else {
      // Fetch from database
      const connection = await db.query.stripeConnections.findFirst({
        where: eq(stripeConnections.organizationId, organizationId),
      });

      if (!connection || !connection.isActive) {
        console.warn(
          `No active Stripe connection for organization ${organizationId}`,
        );
        return null;
      }

      // Decrypt access token
      accessToken = decrypt(connection.accessToken);

      // Cache for 1 hour
      await cacheSet(
        CacheKeys.stripeConnection(organizationId),
        { accessToken },
        3600,
      );
    }

    // Return authenticated Stripe client
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });
  } catch (error) {
    console.error(
      `Error getting Stripe client for org ${organizationId}:`,
      error,
    );
    return null;
  }
}

/**
 * Get Stripe connection details
 */
export async function getStripeConnection(
  organizationId: string,
  connectionId: string,
) {
  try {
    const connection = await db.query.stripeConnections.findFirst({
      where: and(
        eq(stripeConnections.organizationId, organizationId),
        eq(stripeConnections.id, connectionId),
      ),
    });

    return connection;
  } catch (error) {
    console.error(
      `Error fetching Stripe connection for org ${organizationId}:`,
      error,
    );
    return null;
  }
}

/**
 * Get all Stripe connections for an organization
 */
export async function getStripeConnections(organizationId: string) {
  try {
    const connections = await db.query.stripeConnections.findMany({
      where: eq(stripeConnections.organizationId, organizationId),
      orderBy: (connections, { desc }) => [desc(connections.createdAt)],
    });

    return connections;
  } catch (error) {
    console.error(
      `Error fetching Stripe connections for org ${organizationId}:`,
      error,
    );
    return [];
  }
}

/**
 * Refresh Stripe access token using refresh token
 */
export async function refreshAccessToken(
  connectionId: string,
): Promise<boolean> {
  try {
    const connection = await db.query.stripeConnections.findFirst({
      where: eq(stripeConnections.id, connectionId),
    });

    if (!connection || !connection.refreshToken) {
      return false;
    }

    const refreshToken = decrypt(connection.refreshToken);

    // Exchange refresh token for new access token
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });

    const response = await stripe.oauth.token({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    // Update tokens in database
    await db
      .update(stripeConnections)
      .set({
        accessToken: encrypt(response.access_token!),
        lastSyncAt: new Date(),
      })
      .where(eq(stripeConnections.id, connectionId));

    // Clear cache
    await cacheDel(CacheKeys.stripeConnection(connection.organizationId));

    console.log(`✅ Refreshed access token for connection ${connectionId}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing access token:`, error);
    return false;
  }
}

/**
 * Disconnect Stripe account and revoke access
 */
export async function disconnectStripeAccount(
  organizationId: string,
  connectionId?: string,
): Promise<boolean> {
  try {
    const whereClause = connectionId
      ? and(
        eq(stripeConnections.id, connectionId),
        eq(stripeConnections.organizationId, organizationId),
      )
      : eq(stripeConnections.organizationId, organizationId);

    const connection = await db.query.stripeConnections.findFirst({
      where: whereClause,
    });

    if (!connection) {
      return false;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });

    // Deauthorize the account
    try {
      await stripe.oauth.deauthorize({
        client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
        stripe_user_id: connection.stripeAccountId,
      });
    } catch (error) {
      console.warn("Error deauthorizing Stripe account:", error);
      // Continue even if deauthorization fails
    }

    // Delete webhook endpoint if exists
    // Les webhooks Connect sont gérés au niveau plateforme
    if (connection.webhookEndpointId) {
      try {
        const platformStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2025-11-17.clover",
        });

        await platformStripe.webhookEndpoints.del(connection.webhookEndpointId);
        console.log(
          `✅ Deleted Connect webhook ${connection.webhookEndpointId}`,
        );
      } catch (error) {
        console.warn("Error deleting webhook endpoint:", error);
      }
    }

    // Mark connection as inactive
    await db
      .update(stripeConnections)
      .set({ isActive: false })
      .where(eq(stripeConnections.id, connection.id));

    // Clear cache
    await cacheDel(CacheKeys.stripeConnection(organizationId));

    console.log(
      `✅ Disconnected Stripe account ${connection.stripeAccountId} for organization ${organizationId}`,
    );
    return true;
  } catch (error) {
    console.error(`Error disconnecting Stripe account:`, error);
    return false;
  }
}

/**
 * Verify Stripe connection is active and valid
 */
export async function verifyStripeConnection(
  organizationId: string,
): Promise<boolean> {
  try {
    const client = await getStripeClient(organizationId);
    if (!client) return false;

    // Test the connection by fetching account details
    const account = await client.accounts.retrieve();
    return !!account;
  } catch (error) {
    console.error(
      `Error verifying Stripe connection for org ${organizationId}:`,
      error,
    );
    return false;
  }
}
