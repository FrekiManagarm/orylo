import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/auth.server";

// Force this route to be dynamic and never cached
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const org = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    if (!session?.user?.id || !org?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const query = db
      .select()
      .from(fraudAnalyses)
      .where(eq(fraudAnalyses.organizationId, org.id))
      .orderBy(desc(fraudAnalyses.createdAt));

    const analyses = limit
      ? await query.limit(parseInt(limit, 10))
      : await query;

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Error fetching fraud analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch fraud analyses" },
      { status: 500 },
    );
  }
}
