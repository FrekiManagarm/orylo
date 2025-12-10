import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth.server";
import { getStripeConnection } from "@/lib/stripe/connect";

export async function GET(req: NextRequest) {
  try {
    const requestHeaders = await headers();

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await auth.api.listOrganizations({
      headers: requestHeaders,
    });

    const orgList = (organizations ?? []) as Array<{ id: string }>;

    const { searchParams } = new URL(req.url);
    const organizationIdParam = searchParams.get("organizationId");

    const resolvedOrganizationId =
      organizationIdParam || (orgList.length > 0 ? orgList[0]?.id : null);

    if (!resolvedOrganizationId) {
      return NextResponse.json(
        { error: "No organization found for this user" },
        { status: 400 },
      );
    }

    // Verify the organization belongs to the user
    if (
      organizationIdParam &&
      !orgList.some((org) => org.id === organizationIdParam)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const connection = await getStripeConnection(resolvedOrganizationId);

    return NextResponse.json({
      organizationId: resolvedOrganizationId,
      connection: connection
        ? {
          id: connection.id,
          stripeAccountId: connection.stripeAccountId,
          isActive: connection.isActive,
          lastSyncAt: connection.lastSyncAt,
          webhookEndpointId: connection.webhookEndpointId,
        }
        : null,
    });
  } catch (error) {
    console.error("❌ Error getting Stripe connection status:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
