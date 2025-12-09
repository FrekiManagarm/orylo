import { createTool } from "@mastra/core";
import { z } from "zod";

/**
 * Tool to check email reputation and detect suspicious patterns
 * This is a simple implementation - in production, you'd use a service like EmailRep.io
 */
export const checkEmailReputationTool = createTool({
  id: "check-email-reputation",
  description:
    "Check email address reputation and detect suspicious patterns like disposable emails, typosquatting, or known fraud patterns",
  inputSchema: z.object({
    email: z.string().email().describe("Email address to check"),
  }),
  outputSchema: z.object({
    isDisposable: z.boolean(),
    isSuspicious: z.boolean(),
    reputation: z.enum(["good", "neutral", "suspicious", "bad"]),
    signals: z.any(),
    reasoning: z.string(),
  }),
  execute: async ({ context }) => {
    const { email } = context;

    const signals: Record<string, any> = {};
    let isDisposable = false;
    let isSuspicious = false;
    let reputation: "good" | "neutral" | "suspicious" | "bad" = "neutral";

    // Extract domain
    const domain = email.split("@")[1]?.toLowerCase() || "";

    // Check disposable email domains
    const disposableDomains = [
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
      "mohmal.com",
      "sharklasers.com",
    ];

    if (disposableDomains.includes(domain)) {
      isDisposable = true;
      isSuspicious = true;
      reputation = "bad";
      signals.disposable_domain = true;
    }

    // Check for suspicious patterns
    const localPart = email.split("@")[0] || "";

    // Random character pattern (e.g., "asdfghjkl@...")
    if (/^[a-z]{10,}$/.test(localPart)) {
      isSuspicious = true;
      signals.random_pattern = true;
      if (reputation === "neutral") reputation = "suspicious";
    }

    // Numbers only
    if (/^\d+$/.test(localPart)) {
      isSuspicious = true;
      signals.numbers_only = true;
      if (reputation === "neutral") reputation = "suspicious";
    }

    // Check for common typosquatting
    const legitimateDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    const typosquattingPatterns = [
      "gmial.com",
      "gmai1.com",
      "yahooo.com",
      "outlok.com",
    ];

    if (typosquattingPatterns.includes(domain)) {
      isSuspicious = true;
      signals.typosquatting = true;
      reputation = "suspicious";
    }

    // Build reasoning
    const reasons = [];
    if (isDisposable) reasons.push("Disposable email domain detected");
    if (signals.random_pattern) reasons.push("Random character pattern");
    if (signals.numbers_only) reasons.push("Email contains only numbers");
    if (signals.typosquatting) reasons.push("Potential typosquatting domain");

    const reasoning =
      reasons.length > 0
        ? reasons.join("; ")
        : "Email appears legitimate with no suspicious patterns";

    return {
      isDisposable,
      isSuspicious,
      reputation,
      signals,
      reasoning,
    };
  },
});
