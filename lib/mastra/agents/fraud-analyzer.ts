import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { checkEmailReputationTool } from "../tools/checkEmailReputationTool";
import { getIPGeolocationTool } from "../tools/getIPGeolocationTool";
import type { AIModelConfig } from "../config";
import { callAIWithCircuitBreaker } from "@/lib/circuit-breaker";
import type Stripe from "stripe";

export interface FraudAnalysisContext {
  paymentIntent: Stripe.PaymentIntent;
  organizationId: string;
  quickCheckSignals?: Record<string, any>;
  historicalData?: {
    previousFraudCount: number;
    averageAmount: number;
  };
}

export interface FraudAnalysisResult {
  riskScore: number; // 0-100
  recommendation: "ACCEPT" | "REVIEW" | "BLOCK" | "REQUIRE_3DS";
  reasoning: string;
  signals: Record<string, any>;
  agentsUsed: string[];
}

const FRAUD_ANALYSIS_PROMPT = `You are an expert fraud detection AI assistant for payment processing. Your role is to analyze payment transactions and identify potential fraud with high accuracy.

ANALYSIS FRAMEWORK:
1. **Email Analysis**: Check for disposable emails, suspicious patterns, typosquatting
2. **Geolocation**: Identify VPN/proxy usage, high-risk countries, IP mismatches
3. **Transaction Patterns**: Unusual amounts, velocity, timing
4. **Behavioral Signals**: Quick checks results, historical patterns

RISK SCORING (0-100):
- 0-30: LOW RISK - Accept transaction
- 31-60: MEDIUM RISK - Review or require additional authentication
- 61-80: HIGH RISK - Require 3D Secure authentication
- 81-100: CRITICAL RISK - Block transaction

RECOMMENDATIONS:
- ACCEPT: Low risk, proceed normally
- REVIEW: Flag for manual review but allow payment
- REQUIRE_3DS: Require 3D Secure authentication
- BLOCK: High fraud risk, cancel payment immediately

IMPORTANT GUIDELINES:
- Be conservative but not overly strict (avoid false positives)
- Consider context: B2B vs B2C, product type, typical transaction patterns
- Weight multiple signals together - one suspicious signal alone may not be fraud
- Explain your reasoning clearly for transparency
- When in doubt, prefer REVIEW over BLOCK

Analyze the transaction data and provide:
1. A risk score (0-100)
2. A clear recommendation (ACCEPT/REVIEW/REQUIRE_3DS/BLOCK)
3. Detailed reasoning explaining your decision
4. Key signals that influenced your decision`;

/**
 * Create fraud analyzer agent with dynamic model configuration
 */
export function createFraudAnalyzer(modelConfig: AIModelConfig): Agent {
  // Select model provider based on config
  const model =
    modelConfig.provider === "openai"
      ? openai(modelConfig.model)
      : anthropic(modelConfig.model);

  return new Agent({
    name: "fraud-analyzer",
    instructions: FRAUD_ANALYSIS_PROMPT,
    model,
    tools: {
      checkEmailReputation: checkEmailReputationTool,
      getIPGeolocation: getIPGeolocationTool,
    },
  });
}

/**
 * Analyze a payment for fraud using AI agent
 */
export async function analyzeFraud(
  context: FraudAnalysisContext,
  modelConfig: AIModelConfig,
): Promise<FraudAnalysisResult> {
  try {
    const { paymentIntent, quickCheckSignals, historicalData } = context;

    // Create agent with configured model
    const agent = createFraudAnalyzer(modelConfig);

    // Prepare analysis prompt with all available data
    const analysisPrompt = buildAnalysisPrompt(
      paymentIntent,
      quickCheckSignals,
      historicalData,
    );

    console.log(
      `🤖 Starting AI fraud analysis for payment ${paymentIntent.id} using ${modelConfig.provider}/${modelConfig.model}`,
    );

    // Execute analysis with circuit breaker
    const result = await callAIWithCircuitBreaker(async () => {
      const response = await agent.generate(analysisPrompt);
      return response;
    });

    // Parse AI response
    const analysis = parseAIResponse(result.text);

    console.log(
      `✅ Fraud analysis complete: Risk Score ${analysis.riskScore}, Recommendation: ${analysis.recommendation}`,
    );

    return {
      ...analysis,
      agentsUsed: [`${modelConfig.provider}/${modelConfig.model}`],
    };
  } catch (error) {
    console.error("❌ Error in AI fraud analysis:", error);

    // Return safe fallback on error
    return {
      riskScore: 50,
      recommendation: "REVIEW",
      reasoning:
        "AI analysis failed, flagged for manual review as a precaution",
      signals: { error: true, errorMessage: String(error) },
      agentsUsed: ["fallback"],
    };
  }
}

/**
 * Build detailed analysis prompt with all available data
 */
function buildAnalysisPrompt(
  paymentIntent: Stripe.PaymentIntent,
  quickCheckSignals?: Record<string, any>,
  historicalData?: { previousFraudCount: number; averageAmount: number },
): string {
  const metadata = paymentIntent.metadata || {};

  let prompt = `Analyze this payment transaction for fraud:\n\n`;

  // Transaction details
  prompt += `TRANSACTION DETAILS:\n`;
  prompt += `- Payment ID: ${paymentIntent.id}\n`;
  prompt += `- Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}\n`;
  prompt += `- Email: ${paymentIntent.receipt_email || "N/A"}\n`;
  prompt += `- Status: ${paymentIntent.status}\n`;
  prompt += `- Created: ${new Date(paymentIntent.created * 1000).toISOString()}\n`;

  // Customer info from metadata
  if (metadata.ip_address) {
    prompt += `- IP Address: ${metadata.ip_address}\n`;
  }
  if (metadata.country) {
    prompt += `- Country: ${metadata.country}\n`;
  }
  if (metadata.user_agent) {
    prompt += `- User Agent: ${metadata.user_agent}\n`;
  }

  // Quick check results
  if (quickCheckSignals) {
    prompt += `\nQUICK CHECK SIGNALS:\n`;
    prompt += JSON.stringify(quickCheckSignals, null, 2);
  }

  // Historical data
  if (historicalData) {
    prompt += `\nHISTORICAL DATA:\n`;
    prompt += `- Previous Fraud Cases: ${historicalData.previousFraudCount}\n`;
    prompt += `- Average Transaction: ${historicalData.averageAmount / 100} ${paymentIntent.currency.toUpperCase()}\n`;
  }

  prompt += `\n\nUse the available tools to check email reputation and IP geolocation if needed.`;
  prompt += `\n\nProvide your analysis in this format:`;
  prompt += `\nRISK_SCORE: [0-100]`;
  prompt += `\nRECOMMENDATION: [ACCEPT|REVIEW|REQUIRE_3DS|BLOCK]`;
  prompt += `\nREASONING: [Your detailed reasoning]`;
  prompt += `\nKEY_SIGNALS: [List of key signals that influenced your decision]`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(
  text: string,
): Omit<FraudAnalysisResult, "agentsUsed"> {
  const signals: Record<string, any> = {};

  // Extract risk score
  const scoreMatch = text.match(/RISK[_\s]SCORE[:\s]+(\d+)/i);
  const riskScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;

  // Extract recommendation
  const recMatch = text.match(
    /RECOMMENDATION[:\s]+(ACCEPT|REVIEW|REQUIRE_3DS|BLOCK)/i,
  );
  let recommendation: "ACCEPT" | "REVIEW" | "BLOCK" | "REQUIRE_3DS" = "REVIEW";
  if (recMatch) {
    recommendation = recMatch[1].toUpperCase() as any;
  }

  // Extract reasoning
  const reasoningMatch = text.match(/REASONING[:\s]+(.+?)(?=\n[A-Z_]+:|$)/is);
  const reasoning =
    reasoningMatch?.[1]?.trim() || "AI analysis completed - review recommended";

  // Extract key signals
  const signalsMatch = text.match(/KEY[_\s]SIGNALS[:\s]+(.+?)$/is);
  if (signalsMatch) {
    signals.keySignals = signalsMatch[1].trim();
  }

  return {
    riskScore: Math.max(0, Math.min(100, riskScore)),
    recommendation,
    reasoning,
    signals,
  };
}

