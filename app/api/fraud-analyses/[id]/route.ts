import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fraudAnalyses } from "@/lib/schemas/fraudAnalyses";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const analysis = await db.query.fraudAnalyses.findFirst({
      where: eq(fraudAnalyses.id, id),
    });

    if (!analysis || analysis.organizationId !== org.id) {
      return NextResponse.json(
        { error: "Fraud analysis not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error fetching fraud analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch fraud analysis" },
      { status: 500 },
    );
  }
}
