import { db } from "@/lib/db";
import { whitelistEntries } from "@/lib/schemas/whitelistEntries";
import { blacklistEntries } from "@/lib/schemas/blacklistEntries";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, and, sql, gt } from "drizzle-orm";
import type Stripe from "stripe";

export interface QuickCheckResult {
  shouldSkipAI: boolean; // true si décision immédiate possible
  shouldBlock: boolean; // true si blocage immédiat requis
  signals: Record<string, any>;
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
}

// Liste de pays à haut risque (codes ISO 2 lettres)
const HIGH_RISK_COUNTRIES = [
  "NG", // Nigeria
  "GH", // Ghana
  "ID", // Indonesia
  "PK", // Pakistan
  "RO", // Romania
  "BG", // Bulgaria
  "VN", // Vietnam
  "UA", // Ukraine
  "RU", // Russia
  "CN", // China (selon contexte)
];

// Domaines d'emails jetables communs
const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "throwaway.email",
  "temp-mail.org",
  "yopmail.com",
  "getnada.com",
  "trashmail.com",
  "maildrop.cc",
];

/**
 * Execute quick checks on a payment intent (< 100ms target)
 */
export async function runQuickChecks(
  paymentIntent: Stripe.PaymentIntent,
  organizationId: string,
): Promise<QuickCheckResult> {
  const signals: Record<string, any> = {};
  const reasons: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  try {
    // Extract data from payment intent
    const email = paymentIntent.receipt_email || "";
    const amount = paymentIntent.amount;
    const currency = paymentIntent.currency;

    // Get metadata that might contain IP, country, etc.
    const metadata = paymentIntent.metadata || {};
    const ipAddress = metadata.ip_address || "";
    const country = metadata.country || "";
    const cardBin = metadata.card_bin || "";

    // ===== CHECK 1: WHITELIST =====
    const whitelistCheck = await checkWhitelist(
      organizationId,
      email,
      ipAddress,
      country,
      cardBin,
    );

    if (whitelistCheck.isWhitelisted) {
      signals.whitelist = whitelistCheck;
      return {
        shouldSkipAI: true,
        shouldBlock: false,
        signals,
        reasoning: `Transaction whitelisted: ${whitelistCheck.reason}`,
        riskLevel: "low",
      };
    }

    // ===== CHECK 2: BLACKLIST =====
    const blacklistCheck = await checkBlacklist(
      organizationId,
      email,
      ipAddress,
      country,
      cardBin,
    );

    if (blacklistCheck.isBlacklisted) {
      signals.blacklist = blacklistCheck;
      return {
        shouldSkipAI: true,
        shouldBlock: true,
        signals,
        reasoning: `Transaction blacklisted: ${blacklistCheck.reason}`,
        riskLevel: "high",
      };
    }

    // ===== CHECK 3: MONTANT ANORMAL =====
    const amountCheck = await checkAbnormalAmount(
      organizationId,
      amount,
      currency,
    );

    if (amountCheck.isAbnormal) {
      signals.abnormal_amount = amountCheck;
      reasons.push(
        `Amount ${amountCheck.ratio?.toFixed(1) ?? "N/A"}x higher than average`,
      );
      riskLevel = "high";
    }

    // ===== CHECK 4: PAYS À HAUT RISQUE =====
    if (country && HIGH_RISK_COUNTRIES.includes(country.toUpperCase())) {
      signals.high_risk_country = {
        country,
        isHighRisk: true,
      };
      reasons.push(`High-risk country: ${country}`);
      if (riskLevel === "low") riskLevel = "medium";
    }

    // ===== CHECK 5: EMAIL JETABLE =====
    if (email) {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      const isDisposable = DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain || "");

      if (isDisposable) {
        signals.disposable_email = {
          email,
          domain: emailDomain,
          isDisposable: true,
        };
        reasons.push(`Disposable email detected: ${emailDomain}`);
        if (riskLevel === "low") riskLevel = "medium";
      }
    }

    // ===== CHECK 6: VELOCITY (même email, multiples transactions récentes) =====
    if (email) {
      const velocityCheck = await checkVelocity(organizationId, email);

      if (velocityCheck.isSuspicious) {
        signals.velocity = velocityCheck;
        reasons.push(
          `High velocity: ${velocityCheck.count} transactions in ${velocityCheck.timeWindow}`,
        );
        riskLevel = "high";
      }
    }

    // Décision finale
    const shouldSkipAI = riskLevel === "low" && reasons.length === 0;
    const shouldBlock = false; // On ne bloque pas automatiquement sans AI

    return {
      shouldSkipAI,
      shouldBlock,
      signals,
      reasoning:
        reasons.length > 0
          ? reasons.join("; ")
          : "No immediate risk signals detected",
      riskLevel,
    };
  } catch (error) {
    console.error("❌ Error in quick checks:", error);

    // En cas d'erreur, on ne skip pas l'AI
    return {
      shouldSkipAI: false,
      shouldBlock: false,
      signals: { error: true },
      reasoning: "Quick checks failed, proceeding to AI analysis",
      riskLevel: "low",
    };
  }
}

/**
 * Check if transaction matches whitelist
 */
async function checkWhitelist(
  organizationId: string,
  email: string,
  ipAddress: string,
  country: string,
  cardBin: string,
): Promise<{ isWhitelisted: boolean; reason?: string; entry?: any }> {
  try {
    // Check all whitelist types
    const checks = [];

    if (email) {
      checks.push(
        db.query.whitelistEntries.findFirst({
          where: and(
            eq(whitelistEntries.organizationId, organizationId),
            eq(whitelistEntries.type, "email"),
            eq(whitelistEntries.value, email.toLowerCase()),
          ),
        }),
      );
    }

    if (ipAddress) {
      checks.push(
        db.query.whitelistEntries.findFirst({
          where: and(
            eq(whitelistEntries.organizationId, organizationId),
            eq(whitelistEntries.type, "ip"),
            eq(whitelistEntries.value, ipAddress),
          ),
        }),
      );
    }

    if (country) {
      checks.push(
        db.query.whitelistEntries.findFirst({
          where: and(
            eq(whitelistEntries.organizationId, organizationId),
            eq(whitelistEntries.type, "country"),
            eq(whitelistEntries.value, country.toUpperCase()),
          ),
        }),
      );
    }

    if (cardBin) {
      checks.push(
        db.query.whitelistEntries.findFirst({
          where: and(
            eq(whitelistEntries.organizationId, organizationId),
            eq(whitelistEntries.type, "card_bin"),
            eq(whitelistEntries.value, cardBin),
          ),
        }),
      );
    }

    const results = await Promise.all(checks);
    const match = results.find((r) => r !== undefined);

    if (match) {
      return {
        isWhitelisted: true,
        reason: match.reason || `Whitelisted ${match.type}: ${match.value}`,
        entry: match,
      };
    }

    return { isWhitelisted: false };
  } catch (error) {
    console.error("Error checking whitelist:", error);
    return { isWhitelisted: false };
  }
}

/**
 * Check if transaction matches blacklist
 */
async function checkBlacklist(
  organizationId: string,
  email: string,
  ipAddress: string,
  country: string,
  cardBin: string,
): Promise<{ isBlacklisted: boolean; reason?: string; entry?: any }> {
  try {
    const checks = [];

    if (email) {
      checks.push(
        db.query.blacklistEntries.findFirst({
          where: and(
            eq(blacklistEntries.organizationId, organizationId),
            eq(blacklistEntries.type, "email"),
            eq(blacklistEntries.value, email.toLowerCase()),
          ),
        }),
      );
    }

    if (ipAddress) {
      checks.push(
        db.query.blacklistEntries.findFirst({
          where: and(
            eq(blacklistEntries.organizationId, organizationId),
            eq(blacklistEntries.type, "ip"),
            eq(blacklistEntries.value, ipAddress),
          ),
        }),
      );
    }

    if (country) {
      checks.push(
        db.query.blacklistEntries.findFirst({
          where: and(
            eq(blacklistEntries.organizationId, organizationId),
            eq(blacklistEntries.type, "country"),
            eq(blacklistEntries.value, country.toUpperCase()),
          ),
        }),
      );
    }

    if (cardBin) {
      checks.push(
        db.query.blacklistEntries.findFirst({
          where: and(
            eq(blacklistEntries.organizationId, organizationId),
            eq(blacklistEntries.type, "card_bin"),
            eq(blacklistEntries.value, cardBin),
          ),
        }),
      );
    }

    const results = await Promise.all(checks);
    const match = results.find((r) => r !== undefined);

    if (match) {
      return {
        isBlacklisted: true,
        reason: match.reason || `Blacklisted ${match.type}: ${match.value}`,
        entry: match,
      };
    }

    return { isBlacklisted: false };
  } catch (error) {
    console.error("Error checking blacklist:", error);
    return { isBlacklisted: false };
  }
}

/**
 * Check if amount is abnormally high compared to organization's history
 */
async function checkAbnormalAmount(
  organizationId: string,
  amount: number,
  currency: string,
): Promise<{ isAbnormal: boolean; ratio?: number; average?: number }> {
  try {
    // Get average transaction amount for this org (last 100 transactions)
    const result = await db
      .select({
        avg: sql<number>`avg(${fraudAnalyses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(fraudAnalyses)
      .where(
        and(
          eq(fraudAnalyses.organizationId, organizationId),
          eq(fraudAnalyses.currency, currency),
        ),
      )
      .limit(1);

    const avgAmount = result[0]?.avg || 0;
    const count = result[0]?.count || 0;

    // Need at least 10 transactions to establish a baseline
    if (count < 10) {
      return { isAbnormal: false };
    }

    // Check if amount is > 10x average
    const ratio = avgAmount > 0 ? amount / avgAmount : 0;

    if (ratio > 10) {
      return {
        isAbnormal: true,
        ratio,
        average: avgAmount,
      };
    }

    return { isAbnormal: false };
  } catch (error) {
    console.error("Error checking abnormal amount:", error);
    return { isAbnormal: false };
  }
}

/**
 * Check transaction velocity (multiple transactions from same email in short time)
 */
async function checkVelocity(
  organizationId: string,
  email: string,
): Promise<{ isSuspicious: boolean; count?: number; timeWindow?: string }> {
  try {
    // Count transactions from this email in last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(fraudAnalyses)
      .where(
        and(
          eq(fraudAnalyses.organizationId, organizationId),
          eq(fraudAnalyses.email, email),
          gt(fraudAnalyses.createdAt, oneHourAgo),
        ),
      );

    const count = result[0]?.count || 0;

    // More than 5 transactions in 1 hour is suspicious
    if (count > 5) {
      return {
        isSuspicious: true,
        count,
        timeWindow: "1 hour",
      };
    }

    return { isSuspicious: false };
  } catch (error) {
    console.error("Error checking velocity:", error);
    return { isSuspicious: false };
  }
}
