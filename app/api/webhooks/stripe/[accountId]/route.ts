import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { webhookLogs } from "@/lib/schemas/webhookLogs";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { decrypt } from "@/lib/stripe/encryption";
import { getStripeClient } from "@/lib/stripe/connect";
import { runQuickChecks } from "@/lib/quick-checks";
import { analyzeFraud } from "@/lib/mastra/agents/fraud-analyzer";
import { getModelForOrganization } from "@/lib/mastra/config";
import { executeAction } from "@/lib/stripe/actions";
import { checkLimits, incrementUsage } from "@/lib/autumn";
import { sendAlert, AlertTemplates } from "@/lib/alerts/notifications";

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
    if (stripeCliSecret && (webhookSecret === "whsec_local_dev_secret" || process.env.NODE_ENV === "development")) {
      console.log("🔧 Using Stripe CLI webhook secret from environment");
      webhookSecret = stripeCliSecret;
    }

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
      return NextResponse.json(
        { error: "Account mismatch" },
        { status: 400 },
      );
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
    const limitsCheck = await checkLimits(organizationId, 1);

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

/**
 * Handle payment_intent.created event
 */
async function handlePaymentIntentCreated(
  event: Stripe.Event,
  connection: any,
  organizationId: string,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`🔍 Processing payment: ${paymentIntent.id}`);

  const settings = connection.organization.settings;
  if (!settings) {
    throw new Error("Organization settings not found");
  }

  // Step 1: Quick checks (< 100ms)
  const quickCheck = await runQuickChecks(paymentIntent, organizationId);

  // If whitelisted - accept immediately
  if (quickCheck.shouldSkipAI && !quickCheck.shouldBlock) {
    await db.insert(fraudAnalyses).values({
      organizationId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      email: paymentIntent.receipt_email || null,
      riskScore: 0,
      recommandation: "ACCEPT",
      reasoning: quickCheck.reasoning,
      signals: quickCheck.signals,
      agentsUsed: ["quick_check"],
      blocked: false,
      action: "accepted",
    });

    await incrementUsage(organizationId, 1);
    return { accepted: true, reason: "whitelisted" };
  }

  // If blacklisted - block immediately
  if (quickCheck.shouldBlock) {
    const stripeClient = await getStripeClient(organizationId);

    if (stripeClient) {
      try {
        await stripeClient.paymentIntents.cancel(paymentIntent.id, {
          cancellation_reason: "fraudulent",
        });
      } catch (err) {
        console.error("Error canceling payment:", err);
      }
    }

    await db.insert(fraudAnalyses).values({
      organizationId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      email: paymentIntent.receipt_email || null,
      riskScore: 100,
      recommandation: "BLOCK",
      reasoning: quickCheck.reasoning,
      signals: quickCheck.signals,
      agentsUsed: ["quick_check"],
      blocked: true,
      action: "canceled",
    });

    // Send alert
    await sendAlert(
      organizationId,
      "payment_blocked",
      AlertTemplates.paymentBlocked(
        paymentIntent.id,
        quickCheck.reasoning,
        paymentIntent.amount,
        paymentIntent.currency,
      ),
    );

    await incrementUsage(organizationId, 1);
    return { blocked: true, reason: "blacklisted" };
  }

  // Step 2: AI analysis
  try {
    const modelConfig = await getModelForOrganization(organizationId);

    const aiAnalysis = await analyzeFraud(
      {
        paymentIntent,
        organizationId,
        quickCheckSignals: quickCheck.signals,
      },
      modelConfig,
    );

    console.log(
      `🤖 AI Analysis: Score ${aiAnalysis.riskScore}, Recommendation: ${aiAnalysis.recommendation}`,
    );

    // Save analysis to database
    const [analysis] = await db
      .insert(fraudAnalyses)
      .values({
        organizationId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        email: paymentIntent.receipt_email || null,
        riskScore: aiAnalysis.riskScore,
        recommandation: aiAnalysis.recommendation,
        reasoning: aiAnalysis.reasoning,
        signals: { ...quickCheck.signals, ...aiAnalysis.signals },
        agentsUsed: [...aiAnalysis.agentsUsed, "quick_check"],
        blocked: false,
        action: "accepted",
      })
      .returning();

    // Step 3: Execute action based on settings
    const stripeClient = await getStripeClient(organizationId);

    if (stripeClient) {
      const actionResult = await executeAction(
        paymentIntent.id,
        aiAnalysis.riskScore,
        aiAnalysis.recommendation,
        stripeClient,
        {
          autoBlock: settings.autoBlock,
          shadowMode: settings.shadowMode,
          blockThreshold: settings.blockThreshold,
          require3DSScore: settings.require3DSScore,
        },
        aiAnalysis.reasoning,
      );

      // Send alerts for high risk or blocked payments
      if (aiAnalysis.riskScore >= 70) {
        await sendAlert(
          organizationId,
          "high_risk_detected",
          AlertTemplates.highRiskDetected(
            paymentIntent.id,
            aiAnalysis.riskScore,
            paymentIntent.amount,
            paymentIntent.currency,
          ),
        );
      }

      if (actionResult.action === "canceled") {
        await sendAlert(
          organizationId,
          "payment_blocked",
          AlertTemplates.paymentBlocked(
            paymentIntent.id,
            aiAnalysis.reasoning,
            paymentIntent.amount,
            paymentIntent.currency,
          ),
        );
      }
    }

    // Increment usage
    await incrementUsage(organizationId, 1);

    return {
      analyzed: true,
      riskScore: aiAnalysis.riskScore,
      recommendation: aiAnalysis.recommendation,
    };
  } catch (aiError) {
    console.error("❌ AI analysis failed:", aiError);

    // Fallback: save with manual review flag
    await db.insert(fraudAnalyses).values({
      organizationId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      email: paymentIntent.receipt_email || null,
      riskScore: 50,
      recommandation: "REVIEW",
      reasoning: "AI analysis failed - flagged for manual review",
      signals: { error: true, ...quickCheck.signals },
      agentsUsed: ["quick_check", "fallback"],
      blocked: false,
      action: "accepted",
    });

    await incrementUsage(organizationId, 1);
    return { analyzed: false, reason: "ai_error", requiresReview: true };
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(
  event: Stripe.Event,
  connection: any,
  organizationId: string,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`✅ Payment succeeded: ${paymentIntent.id}`);

  // Check if this payment was flagged as high risk
  const analysis = await db.query.fraudAnalyses.findFirst({
    where: and(
      eq(fraudAnalyses.organizationId, organizationId),
      eq(fraudAnalyses.paymentIntentId, paymentIntent.id),
    ),
  });

  if (analysis && analysis.riskScore >= 80 && !analysis.blocked) {
    // High risk payment went through - consider auto-refund
    const settings = connection.organization.settings;

    if (settings?.autoBlock && !settings?.shadowMode) {
      console.warn(
        `⚠️ High-risk payment ${paymentIntent.id} succeeded - considering refund`,
      );

      const stripeClient = await getStripeClient(organizationId);
      if (stripeClient) {
        try {
          await stripeClient.refunds.create({
            payment_intent: paymentIntent.id,
            reason: "fraudulent",
            metadata: {
              auto_refund: "true",
              risk_score: String(analysis.riskScore),
            },
          });

          await db
            .update(fraudAnalyses)
            .set({ action: "refunded" })
            .where(eq(fraudAnalyses.id, analysis.id));

          console.log(`💸 Auto-refunded high-risk payment ${paymentIntent.id}`);
        } catch (refundError) {
          console.error("Error auto-refunding:", refundError);
        }
      }
    }
  }

  return { processed: true };
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(
  event: Stripe.Event,
  organizationId: string,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`❌ Payment failed: ${paymentIntent.id}`);

  // Update analysis if exists
  await db
    .update(fraudAnalyses)
    .set({
      signals: {
        payment_failed: true,
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message,
      },
    })
    .where(eq(fraudAnalyses.paymentIntentId, paymentIntent.id));

  return { processed: true };
}

/**
 * Handle charge.dispute.created event
 */
async function handleDisputeCreated(
  event: Stripe.Event,
  organizationId: string,
) {
  const dispute = event.data.object as Stripe.Dispute;

  console.log(
    `⚡ Dispute created: ${dispute.id} for ${dispute.payment_intent}`,
  );

  // Find and update the fraud analysis
  const analysis = await db.query.fraudAnalyses.findFirst({
    where: and(
      eq(fraudAnalyses.organizationId, organizationId),
      eq(fraudAnalyses.paymentIntentId, dispute.payment_intent as string),
    ),
  });

  if (analysis) {
    await db
      .update(fraudAnalyses)
      .set({
        actualFraud: true, // Mark as confirmed fraud for learning
      })
      .where(eq(fraudAnalyses.id, analysis.id));

    console.log(
      `📊 Marked payment ${dispute.payment_intent} as confirmed fraud`,
    );
  }

  // Send alert
  await sendAlert(
    organizationId,
    "dispute_received",
    AlertTemplates.disputeReceived(
      dispute.payment_intent as string,
      dispute.id,
      dispute.amount,
      dispute.currency,
    ),
  );

  return { processed: true, markedAsFraud: !!analysis };
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(
  event: Stripe.Event,
  organizationId: string,
) {
  const charge = event.data.object as Stripe.Charge;

  console.log(`💸 Charge refunded: ${charge.id}`);

  // Update analysis if exists
  if (charge.payment_intent) {
    await db
      .update(fraudAnalyses)
      .set({ action: "refunded" })
      .where(
        eq(fraudAnalyses.paymentIntentId, charge.payment_intent as string),
      );
  }

  return { processed: true };
}
