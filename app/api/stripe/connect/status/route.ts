import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth.server";
import {
  getStripeConnection,
  getStripeConnections,
} from "@/lib/stripe/connect";

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

    const connections = await getStripeConnections(resolvedOrganizationId);
    const legacyConnection = await getStripeConnection(resolvedOrganizationId, connections[0]?.id);

    return NextResponse.json({
      organizationId: resolvedOrganizationId,
      connections: connections.map((conn) => ({
        id: conn.id,
        stripeAccountId: conn.stripeAccountId,
        isActive: conn.isActive,
        lastSyncAt: conn.lastSyncAt,
        webhookEndpointId: conn.webhookEndpointId,
        createdAt: conn.createdAt,
      })),
      connection: legacyConnection
        ? {
          id: legacyConnection.id,
          stripeAccountId: legacyConnection.stripeAccountId,
          isActive: legacyConnection.isActive,
          lastSyncAt: legacyConnection.lastSyncAt,
          webhookEndpointId: legacyConnection.webhookEndpointId,
        }
        : null,
    });
  } catch (error) {
    console.error("❌ Error getting Stripe connection status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
