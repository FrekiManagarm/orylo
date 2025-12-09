import Stripe from "stripe";
import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq } from "drizzle-orm";

/**
 * Block/Cancel a payment intent
 */
export async function blockPayment(
  paymentIntentId: string,
  stripeClient: Stripe,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Cancel the payment intent
    await stripeClient.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: "fraudulent",
    });

    // Update fraud analysis record
    await db
      .update(fraudAnalyses)
      .set({
        blocked: true,
        action: "canceled",
        reasoning: reason,
      })
      .where(eq(fraudAnalyses.paymentIntentId, paymentIntentId));

    console.log(`✅ Blocked payment: ${paymentIntentId} - Reason: ${reason}`);

    return { success: true };
  } catch (error) {
    console.error(`❌ Error blocking payment ${paymentIntentId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Require 3D Secure for a payment intent
 */
export async function require3DS(
  paymentIntentId: string,
  stripeClient: Stripe,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update payment intent to require 3DS
    await stripeClient.paymentIntents.update(paymentIntentId, {
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
    });

    // Update fraud analysis record
    await db
      .update(fraudAnalyses)
      .set({
        action: "3ds_required",
        reasoning: reason || "3D Secure authentication required for security",
      })
      .where(eq(fraudAnalyses.paymentIntentId, paymentIntentId));

    console.log(
      `✅ Required 3DS for payment: ${paymentIntentId}${reason ? ` - Reason: ${reason}` : ""}`,
    );

    return { success: true };
  } catch (error) {
    console.error(`❌ Error requiring 3DS for ${paymentIntentId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Refund a payment intent
 */
export async function refundPayment(
  paymentIntentId: string,
  stripeClient: Stripe,
  reason: string,
  amount?: number,
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    // Create refund
    const refund = await stripeClient.refunds.create({
      payment_intent: paymentIntentId,
      amount, // If undefined, refunds full amount
      reason: "fraudulent",
      metadata: {
        fraud_reason: reason,
        auto_refund: "true",
      },
    });

    // Update fraud analysis record
    await db
      .update(fraudAnalyses)
      .set({
        action: "refunded",
        reasoning: reason,
      })
      .where(eq(fraudAnalyses.paymentIntentId, paymentIntentId));

    console.log(
      `✅ Refunded payment: ${paymentIntentId} (${refund.id}) - Reason: ${reason}`,
    );

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    console.error(`❌ Error refunding payment ${paymentIntentId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark payment as accepted (no action needed)
 */
export async function acceptPayment(
  paymentIntentId: string,
  reason: string,
): Promise<{ success: boolean }> {
  try {
    await db
      .update(fraudAnalyses)
      .set({
        blocked: false,
        action: "accepted",
        reasoning: reason,
      })
      .where(eq(fraudAnalyses.paymentIntentId, paymentIntentId));

    console.log(`✅ Accepted payment: ${paymentIntentId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error accepting payment ${paymentIntentId}:`, error);
    return { success: false };
  }
}

/**
 * Execute action based on risk score and settings
 */
export async function executeAction(
  paymentIntentId: string,
  riskScore: number,
  recommendation: "ACCEPT" | "REVIEW" | "BLOCK" | "REQUIRE_3DS",
  stripeClient: Stripe,
  settings: {
    autoBlock: boolean;
    shadowMode: boolean;
    blockThreshold: number;
    require3DSScore: number;
  },
  reasoning: string,
): Promise<{
  action: "accepted" | "canceled" | "3ds_required" | "refunded";
  executed: boolean;
}> {
  // Shadow mode: log but don't take action
  if (settings.shadowMode) {
    console.log(
      `🔍 Shadow mode: Would ${recommendation} payment ${paymentIntentId} (score: ${riskScore})`,
    );
    await acceptPayment(
      paymentIntentId,
      `Shadow mode: ${recommendation} recommended`,
    );
    return { action: "accepted", executed: false };
  }

  // Auto-block disabled: always accept
  if (!settings.autoBlock) {
    console.log(
      `ℹ️ Auto-block disabled: Accepting payment ${paymentIntentId} despite ${recommendation}`,
    );
    await acceptPayment(
      paymentIntentId,
      `Auto-block disabled: ${recommendation} recommended`,
    );
    return { action: "accepted", executed: false };
  }

  // Execute based on recommendation
  switch (recommendation) {
    case "BLOCK":
      if (riskScore >= settings.blockThreshold) {
        await blockPayment(paymentIntentId, stripeClient, reasoning);
        return { action: "canceled", executed: true };
      }
      break;

    case "REQUIRE_3DS":
      if (riskScore >= settings.require3DSScore) {
        await require3DS(paymentIntentId, stripeClient, reasoning);
        return { action: "3ds_required", executed: true };
      }
      break;

    case "REVIEW":
      // For review, we accept but flag for manual review
      await acceptPayment(paymentIntentId, `Flagged for review: ${reasoning}`);
      return { action: "accepted", executed: false };

    case "ACCEPT":
    default:
      await acceptPayment(paymentIntentId, reasoning);
      return { action: "accepted", executed: true };
  }

  // Default: accept
  await acceptPayment(paymentIntentId, reasoning);
  return { action: "accepted", executed: true };
}
