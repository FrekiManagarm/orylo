"use server";

import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Revalidate dashboard statistics cache
 * Uses { expire: 0 } for immediate expiration (webhook context)
 */
export async function revalidateDashboardStats() {
  console.log("🔄 Revalidating dashboard-stats tag");
  revalidateTag("dashboard-stats", { expire: 0 });
}

/**
 * Revalidate recent transactions cache
 * Uses { expire: 0 } for immediate expiration (webhook context)
 */
export async function revalidateRecentTransactions() {
  console.log("🔄 Revalidating recent-transactions tag");
  revalidateTag("recent-transactions", { expire: 0 });
}

/**
 * Revalidate all transactions cache
 * Uses { expire: 0 } for immediate expiration (webhook context)
 */
export async function revalidateAllTransactions() {
  console.log("🔄 Revalidating all-transactions tag");
  revalidateTag("all-transactions", { expire: 0 });
}

/**
 * Revalidate all fraud analyses data
 * Uses { expire: 0 } for immediate expiration (webhook context)
 * This will revalidate dashboard stats, recent transactions, and all transactions
 *
 * Note: When called from a Route Handler (webhook), this only invalidates the Data Cache,
 * not the Router Cache. The Router Cache will be invalidated on the next navigation or
 * after the automatic invalidation period. Use AutoRefresh component for automatic updates.
 */
export async function revalidateFraudAnalyses() {
  console.log("🔄 Revalidating fraud-analyses tag");
  revalidateTag("fraud-analyses", { expire: 0 });

  // Also revalidate the dashboard path to help with Router Cache
  // Note: This still won't immediately update the client until router.refresh() is called
  console.log("🔄 Revalidating dashboard path");
  revalidatePath("/dashboard", "page");
}
