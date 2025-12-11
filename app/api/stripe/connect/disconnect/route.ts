import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth.server";
import { disconnectStripeAccount } from "@/lib/stripe/connect";

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await auth.api.listOrganizations({
      headers: requestHeaders,
    });

    const orgList = (organizations ?? []) as Array<{ id: string }>;
    const body = await req.json();
    const organizationIdParam = body.organizationId as string | undefined;
    const connectionId = body.connectionId as string | undefined;

    const resolvedOrganizationId =
      organizationIdParam || (orgList.length > 0 ? orgList[0]?.id : null);

    if (!resolvedOrganizationId) {
      return NextResponse.json(
        { error: "No organization found for this user" },
        { status: 400 },
      );
    }

    if (
      organizationIdParam &&
      !orgList.some((org) => org.id === organizationIdParam)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const success = await disconnectStripeAccount(
      resolvedOrganizationId,
      connectionId,
    );

    return NextResponse.json({ success });
  } catch (error) {
    console.error("❌ Error disconnecting Stripe:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
