import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { settings } from "@/lib/schemas/settings";
import { encrypt } from "@/lib/stripe/encryption";
import { setupWebhooks } from "@/lib/stripe/webhooks-setup";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

  // Handle OAuth errors
  if (error) {
    console.error(`❌ Stripe OAuth error: ${error} - ${errorDescription}`);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=stripe_connection_failed&reason=${error}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=stripe_connection_failed&reason=missing_params`,
    );
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover",
    });

    console.log(`🔄 Exchanging OAuth code for client ${state}`);

    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    console.log(`✅ Received tokens for Stripe account: ${response.stripe_user_id}`);

    // Encrypt sensitive tokens
    const encryptedAccessToken = encrypt(response.access_token!);
    const encryptedRefreshToken = response.refresh_token
      ? encrypt(response.refresh_token)
      : null;

    // Check if connection already exists for this specific Stripe Account
    const existingConnection = await db.query.stripeConnections.findFirst({
      where: (connections, { and, eq }) =>
        and(
          eq(connections.organizationId, state),
          eq(connections.stripeAccountId, response.stripe_user_id!),
        ),
    });

    let connectionId: string;

    if (existingConnection) {
      // Update existing connection
      await db
        .update(stripeConnections)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          scope: response.scope,
          isActive: true,
          lastSyncAt: new Date(),
        })
        .where(eq(stripeConnections.id, existingConnection.id));

      connectionId = existingConnection.id;
      console.log(
        `✅ Updated existing Stripe connection ${connectionId} for account ${response.stripe_user_id}`,
      );
    } else {
      // Create new connection
      const [newConnection] = await db
        .insert(stripeConnections)
        .values({
          organizationId: state as string,
          stripeAccountId: response.stripe_user_id!,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          scope: response.scope!,
          isActive: true,
        })
        .returning();

      connectionId = newConnection.id;
      console.log(
        `✅ Created new Stripe connection ${connectionId} for org ${state}`,
      );
    }

    // Setup webhooks on the connected account
    const webhookResult = await setupWebhooks(
      response.stripe_user_id!,
      response.access_token!,
      state as string,
    );

    if (webhookResult) {
      console.log(
        `✅ Webhooks configured for account ${response.stripe_user_id}`,
      );
    } else {
      console.warn(
        `⚠️ Failed to setup webhooks for account ${response.stripe_user_id}`,
      );
    }

    // Create default settings if they don't exist
    const existingSettings = await db.query.settings.findFirst({
      where: eq(settings.organizationId, state as string),
    });

    if (!existingSettings) {
      await db.insert(settings).values({
        organizationId: state as string,
        blockThreshold: 80,
        reviewThreshold: 60,
        require3DSScore: 70,
        emailAlerts: true,
        autoBlock: true,
        shadowMode: false,
      });

      console.log(`✅ Created default settings for org ${state}`);
    }

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${baseUrl}/dashboard?success=stripe_connected`,
    );
  } catch (error) {
    console.error("❌ Error processing Stripe OAuth callback:", error);

    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=stripe_connection_failed&reason=server_error`,
    );
  }
}
