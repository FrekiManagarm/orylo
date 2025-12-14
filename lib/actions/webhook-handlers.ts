"use server";

import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/connect";
import { runQuickChecks } from "@/lib/quick-checks";
import { analyzeFraud } from "@/lib/mastra/agents/fraud-analyzer";
import { getModelForOrganization } from "@/lib/mastra/config";
import { executeAction } from "@/lib/stripe/actions";
import { incrementUsage } from "@/lib/autumn";
import { sendAlert, AlertTemplates } from "@/lib/alerts/notifications";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

/**
 * Handle payment_intent.created event
 */
export async function handlePaymentIntentCreated(
  event: Stripe.Event,
  connection: any,
  organizationId: string,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`🔍 Processing payment: ${paymentIntent.id}`);
  logger.info({
    type: "payment_intent_created",
    paymentIntentId: paymentIntent.id,
    paymentIntent: paymentIntent,
  });

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

    await incrementUsage(organizationId);

    // Revalidate paths to refresh data
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/alerts");

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

    await incrementUsage(organizationId);

    // Revalidate paths to refresh data
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/alerts");

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
    await incrementUsage(organizationId);

    // Revalidate paths to refresh data
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/alerts");

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

    await incrementUsage(organizationId);

    // Revalidate paths to refresh data
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/alerts");

    return { analyzed: false, reason: "ai_error", requiresReview: true };
  }
}

/**
 * Handle payment_intent.succeeded event
 */
export async function handlePaymentIntentSucceeded(
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

  // Revalidate paths to refresh data
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return { processed: true };
}

/**
 * Handle payment_intent.payment_failed event
 */
export async function handlePaymentIntentFailed(
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

  // Revalidate paths to refresh data
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return { processed: true };
}

/**
 * Handle charge.dispute.created event
 */
export async function handleDisputeCreated(
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

  // Revalidate paths to refresh data
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/alerts");

  return { processed: true, markedAsFraud: !!analysis };
}

/**
 * Handle charge.refunded event
 */
export async function handleChargeRefunded(
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

  // Revalidate paths to refresh data
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return { processed: true };
}
