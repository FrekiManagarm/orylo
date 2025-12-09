import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { eq } from "drizzle-orm";
import { encrypt } from "./encryption";

/**
 * Setup webhook endpoint on connected Stripe account
 */
export async function setupWebhooks(
  stripeAccountId: string,
  accessToken: string,
  organizationId: string,
): Promise<{ webhookEndpointId: string; webhookSecret: string } | null> {
  try {
    const stripe = new Stripe(accessToken, {
      apiVersion: "2025-11-17.clover",
    });

    // Get base URL from environment or construct it
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.orylo.com";
    const webhookUrl = `${baseUrl}/api/webhooks/stripe/${stripeAccountId}`;

    console.log(`🔗 Setting up webhook for: ${webhookUrl}`);

    // Create webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "payment_intent.created",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.dispute.created",
        "charge.dispute.updated",
        "charge.refunded",
      ],
      description: "Orylo Fraud Shield - Payment monitoring",
    });

    console.log(
      `✅ Webhook endpoint created: ${webhookEndpoint.id} for account ${stripeAccountId}`,
    );

    // Update connection in database with webhook details
    await db
      .update(stripeConnections)
      .set({
        webhookEndpointId: webhookEndpoint.id,
        webhookSecret: encrypt(webhookEndpoint.secret!),
        lastSyncAt: new Date(),
      })
      .where(eq(stripeConnections.stripeAccountId, stripeAccountId));

    return {
      webhookEndpointId: webhookEndpoint.id,
      webhookSecret: webhookEndpoint.secret!,
    };
  } catch (error) {
    console.error(
      `❌ Error setting up webhooks for account ${stripeAccountId}:`,
      error,
    );
    return null;
  }
}

/**
 * Delete webhook endpoint from Stripe account
 */
export async function deleteWebhooks(
  stripeAccountId: string,
  accessToken: string,
  webhookEndpointId: string,
): Promise<boolean> {
  try {
    const stripe = new Stripe(accessToken, {
      apiVersion: "2025-11-17.clover",
    });

    await stripe.webhookEndpoints.del(webhookEndpointId);

    console.log(
      `✅ Deleted webhook endpoint ${webhookEndpointId} for account ${stripeAccountId}`,
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Error deleting webhook endpoint ${webhookEndpointId}:`,
      error,
    );
    return false;
  }
}

/**
 * Update webhook endpoint events
 */
export async function updateWebhookEvents(
  accessToken: string,
  webhookEndpointId: string,
  events: string[],
): Promise<boolean> {
  try {
    const stripe = new Stripe(accessToken, {
      apiVersion: "2025-11-17.clover",
    });

    await stripe.webhookEndpoints.update(webhookEndpointId, {
      enabled_events: events as any,
    });

    console.log(`✅ Updated webhook endpoint ${webhookEndpointId} events`);
    return true;
  } catch (error) {
    console.error(
      `❌ Error updating webhook endpoint ${webhookEndpointId}:`,
      error,
    );
    return false;
  }
}

/**
 * List all webhook endpoints for an account
 */
export async function listWebhooks(
  accessToken: string,
): Promise<Stripe.WebhookEndpoint[]> {
  try {
    const stripe = new Stripe(accessToken, {
      apiVersion: "2025-11-17.clover",
    });

    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    return endpoints.data;
  } catch (error) {
    console.error("❌ Error listing webhook endpoints:", error);
    return [];
  }
}
