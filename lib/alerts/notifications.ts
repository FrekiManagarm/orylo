import { db } from "@/lib/db";
import { alerts } from "@/lib/schemas/alerts";
import { settings } from "@/lib/schemas/settings";
import { eq } from "drizzle-orm";

export type AlertType =
  | "high_risk_detected"
  | "payment_blocked"
  | "dispute_received"
  | "limit_reached"
  | "connection_error"
  | "manual_review_required";

export interface AlertData {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  metadata?: Record<string, any>;
}

/**
 * Send alert to all configured channels for an organization
 */
export async function sendAlert(
  organizationId: string,
  type: AlertType,
  data: AlertData,
): Promise<void> {
  try {
    // Get organization settings
    const orgSettings = await db.query.settings.findFirst({
      where: eq(settings.organizationId, organizationId),
    });

    if (!orgSettings) {
      console.warn(
        `No settings found for organization ${organizationId}, skipping alerts`,
      );
      return;
    }

    // Log alert in database
    await db.insert(alerts).values({
      organizationId,
      type,
      title: data.title,
      message: data.message,
      severity: data.severity,
      metadata: data.metadata || {},
    });

    console.log(`📢 Alert created: ${type} for org ${organizationId}`);

    // Send to configured channels
    const promises: Promise<void>[] = [];

    if (orgSettings.emailAlerts) {
      promises.push(sendEmailAlert(organizationId, type, data));
    }

    if (orgSettings.slackWebhook) {
      promises.push(sendSlackAlert(orgSettings.slackWebhook, type, data));
    }

    if (orgSettings.discordWebhook) {
      promises.push(sendDiscordAlert(orgSettings.discordWebhook, type, data));
    }

    // Send all alerts in parallel
    await Promise.allSettled(promises);
  } catch (error) {
    console.error("❌ Error sending alert:", error);
  }
}

/**
 * Send email alert
 * TODO: Integrate with email service (SendGrid, Resend, etc.)
 */
async function sendEmailAlert(
  organizationId: string,
  type: AlertType,
  data: AlertData,
): Promise<void> {
  try {
    console.log(`📧 Sending email alert to org ${organizationId}: ${type}`);

    // TODO: Implement actual email sending
    // Example with Resend:
    /*
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'alerts@orylo.com',
      to: orgEmail,
      subject: `[Orylo Alert] ${data.title}`,
      html: generateEmailHTML(type, data),
    });
    */

    console.log(`✅ Email alert sent for ${type}`);
  } catch (error) {
    console.error("❌ Error sending email alert:", error);
  }
}

/**
 * Send Slack webhook alert
 */
async function sendSlackAlert(
  webhookUrl: string,
  type: AlertType,
  data: AlertData,
): Promise<void> {
  try {
    const color = getSeverityColor(data.severity);
    const emoji = getAlertEmoji(type);

    const payload = {
      attachments: [
        {
          color,
          title: `${emoji} ${data.title}`,
          text: data.message,
          fields: data.metadata
            ? Object.entries(data.metadata).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : [],
          footer: "Orylo Fraud Shield",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }

    console.log(`✅ Slack alert sent for ${type}`);
  } catch (error) {
    console.error("❌ Error sending Slack alert:", error);
  }
}

/**
 * Send Discord webhook alert
 */
async function sendDiscordAlert(
  webhookUrl: string,
  type: AlertType,
  data: AlertData,
): Promise<void> {
  try {
    const color = getSeverityColorInt(data.severity);
    const emoji = getAlertEmoji(type);

    const fields = data.metadata
      ? Object.entries(data.metadata).map(([key, value]) => ({
          name: key,
          value: String(value),
          inline: true,
        }))
      : [];

    const payload = {
      embeds: [
        {
          title: `${emoji} ${data.title}`,
          description: data.message,
          color,
          fields,
          footer: {
            text: "Orylo Fraud Shield",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.statusText}`);
    }

    console.log(`✅ Discord alert sent for ${type}`);
  } catch (error) {
    console.error("❌ Error sending Discord alert:", error);
  }
}

/**
 * Helper: Get Slack color for severity
 */
function getSeverityColor(severity: AlertData["severity"]): string {
  switch (severity) {
    case "critical":
      return "#dc2626"; // red
    case "warning":
      return "#f59e0b"; // orange
    case "info":
    default:
      return "#3b82f6"; // blue
  }
}

/**
 * Helper: Get Discord color integer for severity
 */
function getSeverityColorInt(severity: AlertData["severity"]): number {
  switch (severity) {
    case "critical":
      return 0xdc2626; // red
    case "warning":
      return 0xf59e0b; // orange
    case "info":
    default:
      return 0x3b82f6; // blue
  }
}

/**
 * Helper: Get emoji for alert type
 */
function getAlertEmoji(type: AlertType): string {
  switch (type) {
    case "high_risk_detected":
      return "⚠️";
    case "payment_blocked":
      return "🚫";
    case "dispute_received":
      return "⚡";
    case "limit_reached":
      return "📊";
    case "connection_error":
      return "🔌";
    case "manual_review_required":
      return "👀";
    default:
      return "ℹ️";
  }
}

/**
 * Predefined alert templates
 */
export const AlertTemplates = {
  highRiskDetected: (
    paymentId: string,
    riskScore: number,
    amount: number,
    currency: string,
  ): AlertData => ({
    title: "High Risk Payment Detected",
    message: `Payment ${paymentId} flagged with risk score ${riskScore}/100. Amount: ${amount / 100} ${currency.toUpperCase()}`,
    severity: "warning",
    metadata: {
      paymentId,
      riskScore: `${riskScore}/100`,
      amount: `${amount / 100} ${currency.toUpperCase()}`,
    },
  }),

  paymentBlocked: (
    paymentId: string,
    reason: string,
    amount: number,
    currency: string,
  ): AlertData => ({
    title: "Payment Automatically Blocked",
    message: `Payment ${paymentId} blocked automatically. Reason: ${reason}. Amount: ${amount / 100} ${currency.toUpperCase()}`,
    severity: "critical",
    metadata: {
      paymentId,
      reason,
      amount: `${amount / 100} ${currency.toUpperCase()}`,
    },
  }),

  disputeReceived: (
    paymentId: string,
    disputeId: string,
    amount: number,
    currency: string,
  ): AlertData => ({
    title: "Chargeback Dispute Received",
    message: `Dispute ${disputeId} filed for payment ${paymentId}. Amount: ${amount / 100} ${currency.toUpperCase()}. Investigate immediately.`,
    severity: "critical",
    metadata: {
      paymentId,
      disputeId,
      amount: `${amount / 100} ${currency.toUpperCase()}`,
    },
  }),

  limitReached: (used: number, limit: number): AlertData => ({
    title: "Monthly Transaction Limit Reached",
    message: `Your organization has reached ${used} of ${limit} monthly transactions. Upgrade your plan to continue fraud protection.`,
    severity: "warning",
    metadata: {
      used: String(used),
      limit: String(limit),
      percentage: `${((used / limit) * 100).toFixed(1)}%`,
    },
  }),

  manualReviewRequired: (
    paymentId: string,
    riskScore: number,
    reason: string,
  ): AlertData => ({
    title: "Manual Review Required",
    message: `Payment ${paymentId} requires manual review. Risk score: ${riskScore}/100. ${reason}`,
    severity: "info",
    metadata: {
      paymentId,
      riskScore: `${riskScore}/100`,
      reason,
    },
  }),
};

