import { transactions } from "@/autumn.config";
import { Autumn } from "autumn-js";

export const autumn = new Autumn({
  secretKey: process.env.AUTUMN_SECRET_KEY,
});

/**
 * Check if organization has reached transaction limits
 */
export async function checkTransactionsLimit(organizationId: string) {
  try {
    const response = await autumn.check({
      customer_id: organizationId,
      feature_id: transactions.id,
    });

    // Autumn returns a Result type with data property
    const data = response.data;

    return {
      allowed: data?.allowed,
      used: data?.balance,
      limit: data?.included_usage,
    };
  } catch (error) {
    console.error("Error checking Autumn limits:", error);
    // Fail open - allow transactions if Autumn is down
    return {
      allowed: true,
      used: 0,
      limit: 999999,
    };
  }
}

/**
 * Increment transaction usage counter
 */
export async function incrementUsage(organizationId: string) {
  try {
    await autumn.track({
      customer_id: organizationId,
      feature_id: transactions.id,
      value: 1,
    });

    console.log(
      `📊 Incremented usage for org ${organizationId}: +1 transaction(s)`,
    );
  } catch (error) {
    console.error("Error incrementing Autumn usage:", error);
    // Log but don't fail the transaction
  }
}
