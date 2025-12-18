"use server";

import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, desc, and, gte, lte, sql, or } from "drizzle-orm";
import { auth } from "@/lib/auth/auth.server";
import { headers } from "next/headers";

export type FraudAnalysisFilters = {
  riskScoreRange?: "low" | "medium" | "high";
  actions?: string[];
  dateRange?: "24h" | "7d" | "30d" | "all";
};

export async function getFraudAnalyses(options?: {
  limit?: number;
  offset?: number;
  filters?: FraudAnalysisFilters;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!session?.user?.id || !org?.id) {
      throw new Error("Unauthorized");
    }

    // Build conditions array
    const conditions = [eq(fraudAnalyses.organizationId, org.id)];

    // Apply filters
    if (options?.filters) {
      const { riskScoreRange, actions, dateRange } = options.filters;

      // Risk Score filter
      if (riskScoreRange) {
        if (riskScoreRange === "low") {
          conditions.push(lte(fraudAnalyses.riskScore, 30));
        } else if (riskScoreRange === "medium") {
          conditions.push(
            and(
              gte(fraudAnalyses.riskScore, 30),
              lte(fraudAnalyses.riskScore, 70)
            )!
          );
        } else if (riskScoreRange === "high") {
          conditions.push(gte(fraudAnalyses.riskScore, 70));
        }
      }

      // Actions filter
      if (actions && actions.length > 0) {
        const actionConditions = actions.map((action) =>
          eq(fraudAnalyses.action, action as any)
        );
        conditions.push(or(...actionConditions)!);
      }

      // Date range filter
      if (dateRange && dateRange !== "all") {
        const now = new Date();
        let startDate: Date;

        if (dateRange === "24h") {
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        conditions.push(gte(fraudAnalyses.createdAt, startDate));
      }
    }

    let query = db
      .select()
      .from(fraudAnalyses)
      .where(and(...conditions))
      .orderBy(desc(fraudAnalyses.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }

    const analyses = await query;
    return analyses;
  } catch (error) {
    console.error("Error fetching fraud analyses:", error);
    throw error;
  }
}

export async function getTotalFraudAnalysesCount(filters?: FraudAnalysisFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!session?.user?.id || !org?.id) {
      throw new Error("Unauthorized");
    }

    // Build conditions array
    const conditions = [eq(fraudAnalyses.organizationId, org.id)];

    // Apply same filters as getFraudAnalyses
    if (filters) {
      const { riskScoreRange, actions, dateRange } = filters;

      if (riskScoreRange) {
        if (riskScoreRange === "low") {
          conditions.push(lte(fraudAnalyses.riskScore, 30));
        } else if (riskScoreRange === "medium") {
          conditions.push(
            and(
              gte(fraudAnalyses.riskScore, 30),
              lte(fraudAnalyses.riskScore, 70)
            )!
          );
        } else if (riskScoreRange === "high") {
          conditions.push(gte(fraudAnalyses.riskScore, 70));
        }
      }

      if (actions && actions.length > 0) {
        const actionConditions = actions.map((action) =>
          eq(fraudAnalyses.action, action as any)
        );
        conditions.push(or(...actionConditions)!);
      }

      if (dateRange && dateRange !== "all") {
        const now = new Date();
        let startDate: Date;

        if (dateRange === "24h") {
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        conditions.push(gte(fraudAnalyses.createdAt, startDate));
      }
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(fraudAnalyses)
      .where(and(...conditions));

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching fraud analyses count:", error);
    throw error;
  }
}

export async function getFraudAnalysisById(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!session?.user?.id || !org?.id) {
      throw new Error("Unauthorized");
    }

    const analysis = await db
      .select()
      .from(fraudAnalyses)
      .where(eq(fraudAnalyses.id, id))
      .limit(1);

    if (!analysis[0] || analysis[0].organizationId !== org.id) {
      throw new Error("Fraud analysis not found");
    }

    return analysis[0];
  } catch (error) {
    console.error("Error fetching fraud analysis:", error);
    throw error;
  }
}

export async function getDashboardStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!session?.user?.id || !org?.id) {
      throw new Error("Unauthorized");
    }

    // Get current month date range
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Get previous month date range
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // Get current month stats
    const currentMonthStats = await db
      .select({
        totalTransactions: sql<number>`count(*)::int`,
        totalBlocked: sql<number>`count(case when ${fraudAnalyses.blocked} = true then 1 end)::int`,
        totalAmount: sql<number>`sum(case when ${fraudAnalyses.blocked} = true then ${fraudAnalyses.amount} else 0 end)::int`,
        avgRiskScore: sql<number>`avg(${fraudAnalyses.riskScore})::int`,
      })
      .from(fraudAnalyses)
      .where(
        and(
          eq(fraudAnalyses.organizationId, org.id),
          gte(fraudAnalyses.createdAt, startOfCurrentMonth),
          lte(fraudAnalyses.createdAt, endOfCurrentMonth),
        ),
      );

    // Get previous month stats
    const lastMonthStats = await db
      .select({
        totalTransactions: sql<number>`count(*)::int`,
        totalBlocked: sql<number>`count(case when ${fraudAnalyses.blocked} = true then 1 end)::int`,
        totalAmount: sql<number>`sum(case when ${fraudAnalyses.blocked} = true then ${fraudAnalyses.amount} else 0 end)::int`,
        avgRiskScore: sql<number>`avg(${fraudAnalyses.riskScore})::int`,
      })
      .from(fraudAnalyses)
      .where(
        and(
          eq(fraudAnalyses.organizationId, org.id),
          gte(fraudAnalyses.createdAt, startOfLastMonth),
          lte(fraudAnalyses.createdAt, endOfLastMonth),
        ),
      );

    const current = currentMonthStats[0] || {
      totalTransactions: 0,
      totalBlocked: 0,
      totalAmount: 0,
      avgRiskScore: 0,
    };

    const previous = lastMonthStats[0] || {
      totalTransactions: 0,
      totalBlocked: 0,
      totalAmount: 0,
      avgRiskScore: 0,
    };

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      transactionsAnalyzed: {
        value: current.totalTransactions,
        change: calculateChange(
          current.totalTransactions,
          previous.totalTransactions,
        ),
      },
      fraudsBlocked: {
        value: current.totalBlocked,
        change: calculateChange(current.totalBlocked, previous.totalBlocked),
      },
      moneySaved: {
        value: current.totalAmount, // Amount in cents
        change: calculateChange(current.totalAmount, previous.totalAmount),
      },
      avgRiskScore: {
        value: current.avgRiskScore,
        change: calculateChange(current.avgRiskScore, previous.avgRiskScore),
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}
