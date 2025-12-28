import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { webhookLogs } from "@/lib/schemas/webhookLogs";
import { cardTestingTrackers } from "@/lib/schemas/cardTestingTrackers";
import { alerts } from "@/lib/schemas/alerts";
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
import { revalidatePath } from "next/cache";
import { detectCardTesting } from "@/lib/fraud-detection/card-testing";
import type { CardTestingAttempt } from "@/lib/schemas/cardTestingTrackers";
import { applyRules, buildRuleContext } from "@/lib/fraud-detection/rules-engine";

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

// Désactiver le body parsing automatique pour préserver le corps brut
// Nécessaire pour la vérification de signature Stripe
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Stripe webhook handler for connected accounts
 * 
 * SIMPLIFIED FOR MVP:
 * - No external queues (BullMQ, Trigger.dev)
 * - Direct processing in webhook
 * - Simple rule-based fraud detection
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

    console.log("🔍 Connection:", connection);

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
    const rawBody = await req.arrayBuffer();
    const body = Buffer.from(rawBody).toString("utf-8");

    let webhookSecret = decrypt(connection.webhookSecret);

    // En développement local avec Stripe CLI
    const stripeCliSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (
      stripeCliSecret &&
      (webhookSecret === "whsec_local_dev_secret" ||
        process.env.NODE_ENV === "development")
    ) {
      console.log("🔧 Using Stripe CLI webhook secret from environment");
      webhookSecret = stripeCliSecret;
    }

    const stripe = new Stripe(decrypt(connection.accessToken), {
      apiVersion: "2025-12-15.clover",
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Vérification de sécurité
    if (event.account && event.account !== accountId) {
      console.error(
        `❌ Account mismatch: expected ${accountId}, got ${event.account}`,
      );
      return NextResponse.json({ error: "Account mismatch" }, { status: 400 });
    }

    console.log("event", event);

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

    if (!limitsCheck.allowed) {
      console.warn(`⚠️ Transaction limit reached for org ${organizationId}`);

      await sendAlert(
        organizationId,
        "limit_reached",
        AlertTemplates.limitReached(
          limitsCheck.used || 0,
          limitsCheck.limit || 0,
        ),
      );

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
          console.log("payment_intent.succeeded", event);

          // Apply custom rules BEFORE processing
          const rulesResultSucceeded = await applyRulesOnPayment(
            event,
            organizationId,
            stripe
          );

          result = await handlePaymentIntentSucceeded(
            event,
            connection,
            organizationId,
          );

          // Run card testing detection DIRECTLY (no queue)
          await processCardTestingDetection(event, organizationId, stripe);

          // Merge rules result with handler result
          result = { ...result, rulesEvaluation: rulesResultSucceeded };
          break;

        case "payment_intent.payment_failed":
          console.log("payment_intent.payment_failed", event);
          result = await handlePaymentIntentFailed(event, organizationId);
          // Run card testing detection DIRECTLY (failed attempts are key signals)
          await processCardTestingDetection(event, organizationId, stripe);
          break;

        case "charge.dispute.created":
          console.log("charge.dispute.created", event);
          result = await handleDisputeCreated(event, organizationId);
          break;

        case "charge.refunded":
          console.log("charge.refunded", event);
          result = await handleChargeRefunded(event, organizationId);
          break;

        case "checkout.session.completed":
          console.log("checkout.session.completed", event);
          result = await processCardTestingDetection(event, organizationId, stripe);
          break;

        case "checkout.session.expired":
          console.log("checkout.session.expired", event);
          result = await processCardTestingDetection(event, organizationId, stripe);
          break;

        case "checkout.session.async_payment_succeeded":
          console.log("checkout.session.async_payment_succeeded", event);
          result = await processCardTestingDetection(event, organizationId, stripe);
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
      revalidatePath("/dashboard", "page");

      return NextResponse.json({ received: true, ...result });
    } catch (handlerError) {
      console.error(`❌ Error handling ${event.type}:`, handlerError);

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

/**
 * Apply custom rules on payment
 */
async function applyRulesOnPayment(
  event: Stripe.Event,
  organizationId: string,
  stripe: Stripe
) {
  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Get charge details
    let latestCharge: Stripe.Charge | null = null;

    if (typeof paymentIntent.latest_charge === 'string') {
      latestCharge = await stripe.charges.retrieve(paymentIntent.latest_charge, {
        stripeAccount: paymentIntent.on_behalf_of as string || undefined,
      });
    } else if (paymentIntent.latest_charge) {
      latestCharge = paymentIntent.latest_charge as Stripe.Charge;
    }

    // Build context for rule evaluation
    const context = buildRuleContext(paymentIntent, latestCharge || undefined);

    // Apply rules
    const rulesResult = await applyRules(organizationId, context);

    console.log(`🎯 Règles appliquées: action=${rulesResult.action}`);

    // Handle rule actions
    if (rulesResult.action === "block") {
      console.log(`🚫 Transaction bloquée par règle: ${rulesResult.triggeredRule?.name}`);

      // Refund the payment
      if (latestCharge?.id) {
        await stripe.refunds.create({
          charge: latestCharge.id,
          reason: "fraudulent",
          metadata: {
            blocked_by_rule: rulesResult.triggeredRule?.id || "unknown",
            rule_name: rulesResult.triggeredRule?.name || "unknown",
          },
        }, {
          stripeAccount: paymentIntent.on_behalf_of as string || undefined,
        });

        console.log(`✅ Remboursement automatique effectué`);
      }

      // Create alert
      await db.insert(alerts).values({
        organizationId,
        type: "FRAUD_DETECTED",
        severity: "critical",
        title: "Transaction bloquée par règle",
        message: `La règle "${rulesResult.triggeredRule?.name}" a bloqué une transaction de ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}. Remboursement automatique effectué.`,
        read: false,
        metadata: {
          paymentIntentId: paymentIntent.id,
          ruleId: rulesResult.triggeredRule?.id,
          ruleName: rulesResult.triggeredRule?.name,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      });
    } else if (rulesResult.action === "review") {
      console.log(`⚠️ Transaction marquée pour révision: ${rulesResult.triggeredRule?.name}`);

      // Create alert for review
      await db.insert(alerts).values({
        organizationId,
        type: "FRAUD_DETECTED",
        severity: "warning",
        title: "Transaction à réviser",
        message: `La règle "${rulesResult.triggeredRule?.name}" recommande de réviser cette transaction de ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}.`,
        read: false,
        metadata: {
          paymentIntentId: paymentIntent.id,
          ruleId: rulesResult.triggeredRule?.id,
          ruleName: rulesResult.triggeredRule?.name,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      });
    } else if (rulesResult.action === "alert_only") {
      console.log(`ℹ️ Alerte générée: ${rulesResult.triggeredRule?.name}`);

      // Create info alert
      await db.insert(alerts).values({
        organizationId,
        type: "FRAUD_DETECTED",
        severity: "info",
        title: "Règle déclenchée",
        message: `La règle "${rulesResult.triggeredRule?.name}" a été déclenchée pour une transaction de ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}.`,
        read: false,
        metadata: {
          paymentIntentId: paymentIntent.id,
          ruleId: rulesResult.triggeredRule?.id,
          ruleName: rulesResult.triggeredRule?.name,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      });
    }

    return rulesResult;
  } catch (error) {
    console.error("⚠️ Erreur lors de l'application des règles:", error);
    return null;
  }
}

/**
 * Process card testing detection DIRECTLY in the webhook
 * No external queue needed - simple and fast
 */
async function processCardTestingDetection(
  event: Stripe.Event,
  organizationId: string,
  stripe: Stripe
) {
  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Get session ID from metadata
    const sessionId = paymentIntent.metadata?.sessionId ||
      paymentIntent.metadata?.checkout_session_id ||
      paymentIntent.metadata?.cart_id ||
      paymentIntent.id;

    // Get card details from the latest charge
    let latestCharge: Stripe.Charge | null = null;

    // If latest_charge is a string ID, fetch it; if it's an object, use it directly
    if (typeof paymentIntent.latest_charge === 'string') {
      latestCharge = await stripe.charges.retrieve(paymentIntent.latest_charge, {
        stripeAccount: paymentIntent.on_behalf_of as string || undefined,
      });
    } else if (paymentIntent.latest_charge) {
      latestCharge = paymentIntent.latest_charge as Stripe.Charge;
    }

    const cardDetails = latestCharge?.payment_method_details?.card;

    if (!cardDetails) {
      console.log("ℹ️ No card details found, skipping card testing detection");
      return;
    }

    // Generate fingerprint
    const cardFingerprint = cardDetails.fingerprint ||
      `${cardDetails.last4}-${cardDetails.brand}-${cardDetails.exp_month}-${cardDetails.exp_year}`;

    // Determine status
    const status: "succeeded" | "failed" =
      event.type === "payment_intent.succeeded" ? "succeeded" : "failed";

    // Create attempt record
    const newAttempt: CardTestingAttempt = {
      cardFingerprint,
      cardLast4: cardDetails.last4 || "0000",
      cardBrand: cardDetails.brand || "unknown",
      paymentIntentId: paymentIntent.id,
      status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      ipAddress: paymentIntent.metadata?.ip_address || latestCharge?.metadata?.ip_address,
      timestamp: new Date().toISOString(),
    };

    // Get or create tracker
    let tracker = await db.query.cardTestingTrackers.findFirst({
      where: and(
        eq(cardTestingTrackers.organizationId, organizationId),
        eq(cardTestingTrackers.sessionId, sessionId),
      ),
    });

    let attempts: CardTestingAttempt[];

    if (tracker) {
      // Add attempt to existing tracker
      attempts = [...(tracker.attempts || []), newAttempt];

      await db
        .update(cardTestingTrackers)
        .set({
          attempts,
          updatedAt: new Date(),
        })
        .where(eq(cardTestingTrackers.id, tracker.id));
    } else {
      // Create new tracker
      attempts = [newAttempt];

      const [newTracker] = await db
        .insert(cardTestingTrackers)
        .values({
          organizationId,
          sessionId,
          attempts,
          uniqueCards: 1,
          suspicionScore: 0,
          reasons: [],
          blocked: false,
        })
        .returning();

      tracker = newTracker;
    }

    // Run detection rules
    const result = detectCardTesting(attempts);

    // Update tracker with results
    await db
      .update(cardTestingTrackers)
      .set({
        uniqueCards: result.uniqueCards,
        suspicionScore: result.score,
        reasons: result.reasons,
        recommendation: result.recommendation,
        blocked: result.shouldBlock,
        updatedAt: new Date(),
      })
      .where(eq(cardTestingTrackers.id, tracker.id));

    console.log(`🔍 Card testing analysis: score=${result.score}, recommendation=${result.recommendation}`);

    // If should block and payment succeeded, auto-refund
    if (result.shouldBlock && status === "succeeded") {
      console.log(`🚫 Blocking card testing attempt, initiating refund...`);

      try {
        // Get the charge ID
        if (latestCharge?.id) {
          await stripe.refunds.create({
            charge: latestCharge.id,
            reason: "fraudulent",
          }, {
            stripeAccount: paymentIntent.on_behalf_of as string || undefined,
          });

          // Update tracker
          await db
            .update(cardTestingTrackers)
            .set({
              actionTaken: true,
              actionType: "refunded",
              updatedAt: new Date(),
            })
            .where(eq(cardTestingTrackers.id, tracker.id));

          console.log(`✅ Auto-refund completed for ${paymentIntent.id}`);
        }
      } catch (refundError) {
        console.error("⚠️ Failed to auto-refund:", refundError);
      }

      // Create alert
      await db.insert(alerts).values({
        organizationId,
        type: "CARD_TESTING",
        severity: "critical",
        title: "Card Testing Attack Blocked",
        message: `Detected and blocked a card testing attack. ${result.uniqueCards} cards tested, ${result.totalAttempts} attempts. Payment auto-refunded.`,
        read: false,
        metadata: {
          sessionId,
          score: result.score,
          reasons: result.reasons,
          paymentIntentId: paymentIntent.id,
        },
      });
    } else if (result.recommendation === "REVIEW") {
      // Create alert for review
      await db.insert(alerts).values({
        organizationId,
        type: "CARD_TESTING",
        severity: "warning",
        title: "Suspicious Activity Detected",
        message: `Potential card testing detected. Score: ${result.score}/100. Please review.`,
        read: false,
        metadata: {
          sessionId,
          score: result.score,
          reasons: result.reasons,
          paymentIntentId: paymentIntent.id,
        },
      });
    }

  } catch (error) {
    // Don't fail the webhook if card testing detection fails
    console.error("⚠️ Card testing detection error:", error);
  }
}
