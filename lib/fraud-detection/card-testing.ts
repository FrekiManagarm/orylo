import { CardTestingAttempt, SuspicionReason } from "@/lib/schemas/cardTestingTrackers";

export interface CardTestingResult {
  score: number;
  reasons: SuspicionReason[];
  recommendation: "ALLOW" | "REVIEW" | "BLOCK";
  shouldBlock: boolean;
  uniqueCards: number;
  totalAttempts: number;
  failedAttempts: number;
}

/**
 * Detects card testing attacks using simple rule-based logic.
 * No AI needed - just clear, explainable rules.
 * 
 * Rules:
 * 1. Multiple different cards on same session = suspicious
 * 2. Rapid attempts (many in short time window) = suspicious
 * 3. Fail-fail-fail-success pattern = classic card testing
 * 4. Multiple IPs for same session = suspicious
 */
export function detectCardTesting(attempts: CardTestingAttempt[]): CardTestingResult {
  let score = 0;
  const reasons: SuspicionReason[] = [];

  // Count unique cards
  const uniqueCards = new Set(attempts.map((a) => a.cardFingerprint)).size;
  
  // Count unique IPs
  const uniqueIPs = new Set(
    attempts.map((a) => a.ipAddress).filter(Boolean)
  ).size;

  // Get recent attempts (last 5 minutes)
  const now = Date.now();
  const recentAttempts = attempts.filter((a) => {
    const attemptTime = new Date(a.timestamp).getTime();
    return now - attemptTime < 5 * 60 * 1000; // 5 minutes
  });

  // Count failed attempts
  const failedAttempts = attempts.filter((a) => a.status === "failed").length;
  const succeededAttempts = attempts.filter((a) => a.status === "succeeded").length;

  // Get last 4 attempts for pattern detection
  const lastFour = attempts.slice(-4);
  const lastFourStatuses = lastFour.map((a) => a.status);

  // ═══════════════════════════════════════════════════════════
  // RULE 1: Multiple different cards on same session
  // ═══════════════════════════════════════════════════════════
  if (uniqueCards >= 4) {
    score += 50;
    reasons.push({
      label: "Multiple cards detected",
      description: `${uniqueCards} different cards used on same checkout session`,
      weight: 50,
      severity: "high",
    });
  } else if (uniqueCards === 3) {
    score += 35;
    reasons.push({
      label: "Multiple cards detected",
      description: `${uniqueCards} different cards used on same checkout session`,
      weight: 35,
      severity: "high",
    });
  } else if (uniqueCards === 2) {
    score += 15;
    reasons.push({
      label: "Card change detected",
      description: `2 different cards used on same checkout session`,
      weight: 15,
      severity: "medium",
    });
  }

  // ═══════════════════════════════════════════════════════════
  // RULE 2: Rapid attempts (velocity check)
  // ═══════════════════════════════════════════════════════════
  if (recentAttempts.length >= 5) {
    score += 30;
    reasons.push({
      label: "Rapid attempts",
      description: `${recentAttempts.length} attempts in less than 5 minutes`,
      weight: 30,
      severity: "high",
    });
  } else if (recentAttempts.length >= 3) {
    score += 20;
    reasons.push({
      label: "Multiple attempts",
      description: `${recentAttempts.length} attempts in less than 5 minutes`,
      weight: 20,
      severity: "medium",
    });
  }

  // ═══════════════════════════════════════════════════════════
  // RULE 3: Fail-fail-fail-success pattern (classic card testing)
  // ═══════════════════════════════════════════════════════════
  if (
    lastFourStatuses.length === 4 &&
    lastFourStatuses[0] === "failed" &&
    lastFourStatuses[1] === "failed" &&
    lastFourStatuses[2] === "failed" &&
    lastFourStatuses[3] === "succeeded"
  ) {
    score += 40;
    reasons.push({
      label: "Classic card testing pattern",
      description: "Fail → Fail → Fail → Success pattern detected",
      weight: 40,
      severity: "high",
    });
  } else if (failedAttempts >= 3 && succeededAttempts >= 1) {
    // General pattern: multiple failures before success
    score += 25;
    reasons.push({
      label: "Suspicious failure pattern",
      description: `${failedAttempts} failed attempts before success`,
      weight: 25,
      severity: "medium",
    });
  }

  // ═══════════════════════════════════════════════════════════
  // RULE 4: Multiple IPs for same session
  // ═══════════════════════════════════════════════════════════
  if (uniqueIPs > 1) {
    score += 20;
    reasons.push({
      label: "Multiple IP addresses",
      description: `${uniqueIPs} different IPs used for same session`,
      weight: 20,
      severity: "medium",
    });
  }

  // ═══════════════════════════════════════════════════════════
  // RULE 5: High failure rate
  // ═══════════════════════════════════════════════════════════
  if (attempts.length >= 3 && failedAttempts / attempts.length > 0.7) {
    score += 15;
    reasons.push({
      label: "High failure rate",
      description: `${Math.round((failedAttempts / attempts.length) * 100)}% of attempts failed`,
      weight: 15,
      severity: "medium",
    });
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine recommendation
  let recommendation: "ALLOW" | "REVIEW" | "BLOCK";
  if (score >= 70) {
    recommendation = "BLOCK";
  } else if (score >= 40) {
    recommendation = "REVIEW";
  } else {
    recommendation = "ALLOW";
  }

  return {
    score,
    reasons,
    recommendation,
    shouldBlock: recommendation === "BLOCK",
    uniqueCards,
    totalAttempts: attempts.length,
    failedAttempts,
  };
}

