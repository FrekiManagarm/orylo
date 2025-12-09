import { Autumn } from "autumn-js";

export const autumn = new Autumn({
  secretKey: process.env.AUTUMN_SECRET_KEY,
});

/**
 * Check if organization has reached transaction limits
 */
export async function checkLimits(organizationId: string, amount: number = 1) {
  try {
    const response = await autumn.check({
      customer_id: organizationId,
    });

    // Autumn returns a Result type with data property
    const data = response.data as any;

    return {
      allowed: data?.allowed ?? false,
      used: data?.used ?? 0,
      limit: data?.limit ?? 0,
      features: data?.features ?? [],
    };
  } catch (error) {
    console.error("Error checking Autumn limits:", error);
    // Fail open - allow transactions if Autumn is down
    return {
      allowed: true,
      used: 0,
      limit: 999999,
      features: [],
    };
  }
}

/**
 * Increment transaction usage counter
 */
export async function incrementUsage(
  organizationId: string,
  amount: number = 1,
) {
  try {
    await autumn.track({
      customer_id: organizationId,
      feature_id: "transaction_analyses", // Track fraud analyses
      value: amount,
    });

    console.log(
      `📊 Incremented usage for org ${organizationId}: +${amount} transaction(s)`,
    );
  } catch (error) {
    console.error("Error incrementing Autumn usage:", error);
    // Log but don't fail the transaction
  }
}
