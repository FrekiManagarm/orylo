import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getOrganization, getUser } from "@/lib/actions/user";

// Force this route to be dynamic and never cached
export const dynamic = "force-dynamic";

export async function GET() {
  // try {
  const user = await getUser();
  const org = await getOrganization();

  if (!user?.id || !org?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const stats = {
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

  return NextResponse.json(stats, { status: 200 });
  // } catch (error) {
  //   console.error("Error fetching dashboard stats:", error);
  //   return NextResponse.json(
  //     { error: "Failed to fetch dashboard stats" },
  //     { status: 500 },
  //   );
  // }
}
