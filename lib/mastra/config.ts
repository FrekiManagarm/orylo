import { autumn } from "@/lib/autumn";

export interface AIModelConfig {
  provider: "openai" | "anthropic";
  model: string;
  temperature: number;
}

/**
 * Get AI model configuration based on organization's Autumn plan
 * This mapping can be customized based on your pricing tiers
 */
export async function getModelForOrganization(
  organizationId: string,
): Promise<AIModelConfig> {
  try {
    // Check organization's plan via Autumn
    const planInfo = await autumn.check({
      customer_id: organizationId,
    });

    // For now, we use a default mapping
    // TODO: Customize this based on your Autumn product configuration
    // Example:
    // - Basic plan -> gpt-4o-mini (faster, cheaper)
    // - Pro plan -> gpt-4o (more accurate)
    // - Enterprise plan -> claude-3.5-sonnet (most powerful)

    // Default: OpenAI GPT-4o with low temperature for consistency
    return {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.1,
    };
  } catch (error) {
    console.error("Error fetching model config for org:", error);

    // Fallback to default
    return {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.1,
    };
  }
}

/**
 * Get model configuration by plan name
 * Use this if you have the plan name directly
 */
export function getModelByPlan(planName: string): AIModelConfig {
  const planMapping: Record<string, AIModelConfig> = {
    basic: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.1,
    },
    pro: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.1,
    },
    enterprise: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.1,
    },
  };

  return (
    planMapping[planName.toLowerCase()] || {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.1,
    }
  );
}

/**
 * Validate that required API keys are configured
 */
export function validateAIConfig(): {
  openai: boolean;
  anthropic: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenAI) {
    errors.push("OPENAI_API_KEY is not configured");
  }

  if (!hasAnthropic) {
    errors.push("ANTHROPIC_API_KEY is not configured");
  }

  return {
    openai: hasOpenAI,
    anthropic: hasAnthropic,
    errors,
  };
}

