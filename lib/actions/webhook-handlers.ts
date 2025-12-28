"use server";

import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { runQuickChecks } from "@/lib/quick-checks";
import { incrementUsage } from "@/lib/autumn";
import { sendAlert, AlertTemplates } from "@/lib/alerts/notifications";
import { logger } from "@/lib/logger";

/**
 * Handle payment_intent.created event
 * 
 * SIMPLIFIED FOR MVP:
 * - Only quick checks (whitelist/blacklist)
 * - No AI analysis
 * - Log for tracking
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
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });

  const settings = connection.organization.settings;
  if (!settings) {
    throw new Error("Organization settings not found");
  }

  // Quick checks (whitelist/blacklist)
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

    return { accepted: true, reason: "whitelisted" };
  }

  // If blacklisted - block immediately
  if (quickCheck.shouldBlock) {
    // Note: We don't cancel here anymore, let Stripe handle it
    // or use 3D Secure requirements instead

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

    return { blocked: true, reason: "blacklisted" };
  }

  // Normal payment - just log it
  // Card testing detection will happen on succeeded/failed events
  await db.insert(fraudAnalyses).values({
    organizationId,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    email: paymentIntent.receipt_email || null,
    riskScore: 0,
    recommandation: "ACCEPT",
    reasoning: "Normal payment - monitoring",
    signals: quickCheck.signals,
    agentsUsed: ["quick_check"],
    blocked: false,
    action: "accepted",
  });

  await incrementUsage(organizationId);

  return {
    analyzed: true,
    riskScore: 0,
    recommendation: "ACCEPT",
  };
}

/**
 * Handle payment_intent.succeeded event
 * 
 * SIMPLIFIED FOR MVP:
 * - Just log the success
 * - Card testing detection is handled separately in webhook route
 */
export async function handlePaymentIntentSucceeded(
  event: Stripe.Event,
  connection: any,
  organizationId: string,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`✅ Payment succeeded: ${paymentIntent.id}`);

  logger.info({
    type: "payment_intent_succeeded",
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });

  // Update fraud analysis if it exists
  await db
    .update(fraudAnalyses)
    .set({
      signals: {
        payment_succeeded: true,
        succeeded_at: new Date().toISOString(),
      },
    })
    .where(
      and(
        eq(fraudAnalyses.organizationId, organizationId),
        eq(fraudAnalyses.paymentIntentId, paymentIntent.id),
      ),
    );

  return { processed: true };
}

/**
 * Handle payment_intent.payment_failed event
 * 
 * SIMPLIFIED FOR MVP:
 * - Just log the failure
 * - Card testing detection is handled separately in webhook route
 */
export async function handlePaymentIntentFailed(
  event: Stripe.Event,
  organizationId: string,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log(`❌ Payment failed: ${paymentIntent.id}`);

  logger.info({
    type: "payment_intent_failed",
    paymentIntentId: paymentIntent.id,
    failureCode: paymentIntent.last_payment_error?.code,
    failureMessage: paymentIntent.last_payment_error?.message,
  });

  // Update analysis if exists
  await db
    .update(fraudAnalyses)
    .set({
      signals: {
        payment_failed: true,
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message,
        failed_at: new Date().toISOString(),
      },
    })
    .where(
      and(
        eq(fraudAnalyses.organizationId, organizationId),
        eq(fraudAnalyses.paymentIntentId, paymentIntent.id),
      ),
    );

  return { processed: true };
}

/**
 * Handle charge.dispute.created event
 * 
 * SIMPLIFIED FOR MVP:
 * - Mark payment as confirmed fraud
 * - Send alert
 * - No AI evidence generation (Phase 2 feature)
 */
export async function handleDisputeCreated(
  event: Stripe.Event,
  organizationId: string,
) {
  const dispute = event.data.object as Stripe.Dispute;

  console.log(
    `⚡ Dispute created: ${dispute.id} for ${dispute.payment_intent}`,
  );

  logger.info({
    type: "dispute_created",
    disputeId: dispute.id,
    paymentIntentId: dispute.payment_intent,
    amount: dispute.amount,
    reason: dispute.reason,
  });

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
        signals: {
          ...(analysis.signals || {}),
          dispute_created: true,
          dispute_id: dispute.id,
          dispute_reason: dispute.reason,
        },
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
 * 
 * SIMPLIFIED FOR MVP:
 * - Just update the status
 * - Log for tracking
 */
export async function handleChargeRefunded(
  event: Stripe.Event,
  organizationId: string,
) {
  const charge = event.data.object as Stripe.Charge;

  console.log(`💸 Charge refunded: ${charge.id}`);

  logger.info({
    type: "charge_refunded",
    chargeId: charge.id,
    paymentIntentId: charge.payment_intent,
    amount: charge.amount_refunded,
  });

  // Update analysis if exists
  if (charge.payment_intent) {
    await db
      .update(fraudAnalyses)
      .set({
        action: "refunded",
        signals: {
          refunded: true,
          refunded_at: new Date().toISOString(),
          refund_amount: charge.amount_refunded,
        },
      })
      .where(
        and(
          eq(fraudAnalyses.organizationId, organizationId),
          eq(fraudAnalyses.paymentIntentId, charge.payment_intent as string),
        ),
      );
  }

  return { processed: true };
}
