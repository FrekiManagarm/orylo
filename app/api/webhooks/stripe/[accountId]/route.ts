import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { webhookLogs } from "@/lib/schemas/webhookLogs";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { decrypt } from "@/lib/stripe/encryption";
import { checkTransactionsLimit } from "@/lib/autumn";
import { sendAlert, AlertTemplates } from "@/lib/alerts/notifications";
import {
  handlePaymentIntentCreated,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleDisputeCreated,
  handleChargeRefunded,
} from "@/lib/actions/webhook-handlers";
import { revalidatePath, revalidateTag } from "next/cache";

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

// Désactiver le body parsing automatique pour préserver le corps brut
// Nécessaire pour la vérification de signature Stripe
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler for connected accounts
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const { accountId } = await context.params;

  console.log(`📥 Received webhook for account: ${accountId}`);

  try {
    // 1. Get Stripe connection from database
    const connection = await db.query.stripeConnections.findFirst({
      where: and(
        eq(stripeConnections.stripeAccountId, accountId),
        eq(stripeConnections.isActive, true),
      ),
      with: {
        organization: {
          with: {
            settings: true,
          },
        },
      },
    });

    if (!connection) {
      console.error(`❌ No active connection found for account ${accountId}`);
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 404 },
      );
    }

    const organizationId = connection.organizationId;

    // 2. Verify webhook signature
    const signature = req.headers.get("stripe-signature");

    if (!signature || !connection.webhookSecret) {
      console.error("❌ Missing signature or webhook secret");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    // Lire le corps brut comme Buffer puis convertir en string
    // Cela garantit que nous avons le corps exact envoyé par Stripe
    const rawBody = await req.arrayBuffer();
    const body = Buffer.from(rawBody).toString("utf-8");

    let webhookSecret = decrypt(connection.webhookSecret);

    // En développement local avec Stripe CLI, utiliser le secret depuis l'env si disponible
    // Pour obtenir ce secret : stripe listen --forward-to http://localhost:3000/api/webhooks/stripe/{accountId}
    const stripeCliSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (
      stripeCliSecret &&
      (webhookSecret === "whsec_local_dev_secret" ||
        process.env.NODE_ENV === "development")
    ) {
      console.log("🔧 Using Stripe CLI webhook secret from environment");
      webhookSecret = stripeCliSecret;
    }

    console.log("🔍 Webhook secret:", webhookSecret);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });

    let event: Stripe.Event;
    console.log("🔍 Webhook secret:", webhookSecret.substring(0, 10) + "...");
    console.log("🔍 Signature:", signature);
    console.log("🔍 Body type:", typeof body);
    console.log("🔍 Body length:", body.length);
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Vérification de sécurité : s'assurer que l'événement provient bien du compte attendu
    // Les webhooks Connect incluent le champ 'account' pour identifier le compte source
    if (event.account && event.account !== accountId) {
      console.error(
        `❌ Account mismatch: expected ${accountId}, got ${event.account}`,
      );
      return NextResponse.json({ error: "Account mismatch" }, { status: 400 });
    }

    console.log(`✅ Webhook verified: ${event.type} (${event.id})`);

    // 3. Log webhook in database
    const [webhookLog] = await db
      .insert(webhookLogs)
      .values({
        organizationId,
        eventType: event.type,
        eventId: event.id,
        payload: event.data.object as any,
        processed: false,
      })
      .returning();

    // 4. Check Autumn limits before processing
    const limitsCheck = await checkTransactionsLimit(organizationId);

    console.log(`🔍 Limits check: ${limitsCheck.used} / ${limitsCheck.limit}`);
    console.log(`🔍 Limits check: ${limitsCheck.allowed}`);

    if (!limitsCheck.allowed) {
      console.warn(`⚠️ Transaction limit reached for org ${organizationId}`);

      // Send alert
      await sendAlert(
        organizationId,
        "limit_reached",
        AlertTemplates.limitReached(
          limitsCheck.used || 0,
          limitsCheck.limit || 0,
        ),
      );

      // Mark webhook as processed (skipped due to limit)
      await db
        .update(webhookLogs)
        .set({
          processed: true,
          processedAt: new Date(),
          response: { skipped: true, reason: "limit_reached" },
        })
        .where(eq(webhookLogs.id, webhookLog.id));

      return NextResponse.json({
        received: true,
        processed: false,
        reason: "limit_reached",
      });
    }

    // 5. Route to appropriate handler based on event type
    let result: any = { processed: true };

    try {
      switch (event.type) {
        case "payment_intent.created":
          result = await handlePaymentIntentCreated(
            event,
            connection,
            organizationId,
          );
          break;

        case "payment_intent.succeeded":
          result = await handlePaymentIntentSucceeded(
            event,
            connection,
            organizationId,
          );
          break;

        case "payment_intent.payment_failed":
          result = await handlePaymentIntentFailed(event, organizationId);
          break;

        case "charge.dispute.created":
          result = await handleDisputeCreated(event, organizationId);
          break;

        case "charge.refunded":
          result = await handleChargeRefunded(event, organizationId);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
          result = { processed: false, reason: "unhandled_event_type" };
      }

      // 6. Mark webhook as processed
      await db
        .update(webhookLogs)
        .set({
          processed: true,
          processedAt: new Date(),
          response: result,
          statusCode: 200,
        })
        .where(eq(webhookLogs.id, webhookLog.id));

      revalidatePath(`/dashboard`, "layout");
      revalidatePath("/dashboard", "page")

      return NextResponse.json({ received: true, ...result });
    } catch (handlerError) {
      console.error(`❌ Error handling ${event.type}:`, handlerError);

      // Log error in webhook log
      await db
        .update(webhookLogs)
        .set({
          error:
            handlerError instanceof Error
              ? handlerError.message
              : "Unknown error",
          retryCount: (webhookLog.retryCount || 0) + 1,
        })
        .where(eq(webhookLogs.id, webhookLog.id));

      // Return 200 to Stripe even on error (we'll retry via cron)
      return NextResponse.json({
        received: true,
        error: "Processing failed, will retry",
      });
    }
  } catch (error) {
    console.error("❌ Fatal error in webhook handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
