"use server";

import { db } from "@/lib/db";
import { stripeConnections } from "@/lib/schemas/stripeConnections";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth.server";
import { headers } from "next/headers";

/**
 * Get all Stripe connections for the current organization
 */
export async function getStripeConnections() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    return [];
  }

  const organizationId = session.session.activeOrganizationId;

  const connections = await db.query.stripeConnections.findMany({
    where: eq(stripeConnections.organizationId, organizationId),
    orderBy: (stripeConnections, { desc }) => [
      desc(stripeConnections.isActive),
      desc(stripeConnections.createdAt),
    ],
  });

  return connections.map((conn) => ({
    id: conn.id,
    stripeAccountId: conn.stripeAccountId,
    accountName: conn.accountName,
    isActive: conn.isActive,
  }));
}

