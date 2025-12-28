"use server";

import { db } from "@/lib/db";
import { cardTestingTrackers } from "@/lib/schemas/cardTestingTrackers";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/auth.server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Get card testing trackers for the current organization
 */
export async function getCardTestingTrackers(options?: {
  limit?: number;
  offset?: number;
  minScore?: number;
  blockedOnly?: boolean;
}) {
  const { limit = 20, offset = 0, minScore = 0, blockedOnly = false } = options || {};

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    throw new Error("Organization not found");
  }

  const organizationId = session.session.activeOrganizationId;

  const conditions = [
    eq(cardTestingTrackers.organizationId, organizationId),
    gte(cardTestingTrackers.suspicionScore, minScore),
  ];

  if (blockedOnly) {
    conditions.push(eq(cardTestingTrackers.blocked, true));
  }

  const trackers = await db
    .select()
    .from(cardTestingTrackers)
    .where(and(...conditions))
    .orderBy(desc(cardTestingTrackers.updatedAt))
    .limit(limit)
    .offset(offset);

  return trackers;
}

/**
 * Get card testing statistics for the current organization
 */
export async function getCardTestingStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    throw new Error("Organization not found");
  }

  const organizationId = session.session.activeOrganizationId;

  // Get stats for last 24 hours
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalBlocked, totalSuspicious, totalSessions, last24hBlocked] = await Promise.all([
    // Total blocked sessions
    db
      .select({ count: sql<number>`count(*)` })
      .from(cardTestingTrackers)
      .where(
        and(
          eq(cardTestingTrackers.organizationId, organizationId),
          eq(cardTestingTrackers.blocked, true)
        )
      )
      .then((r) => Number(r[0]?.count || 0)),

    // Total suspicious sessions (score >= 40)
    db
      .select({ count: sql<number>`count(*)` })
      .from(cardTestingTrackers)
      .where(
        and(
          eq(cardTestingTrackers.organizationId, organizationId),
          gte(cardTestingTrackers.suspicionScore, 40)
        )
      )
      .then((r) => Number(r[0]?.count || 0)),

    // Total sessions analyzed
    db
      .select({ count: sql<number>`count(*)` })
      .from(cardTestingTrackers)
      .where(eq(cardTestingTrackers.organizationId, organizationId))
      .then((r) => Number(r[0]?.count || 0)),

    // Blocked in last 24h
    db
      .select({ count: sql<number>`count(*)` })
      .from(cardTestingTrackers)
      .where(
        and(
          eq(cardTestingTrackers.organizationId, organizationId),
          eq(cardTestingTrackers.blocked, true),
          gte(cardTestingTrackers.updatedAt, last24h)
        )
      )
      .then((r) => Number(r[0]?.count || 0)),
  ]);

  return {
    totalBlocked,
    totalSuspicious,
    totalSessions,
    last24hBlocked,
  };
}

/**
 * Unblock a card testing session
 */
export async function unblockSession(trackerId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    throw new Error("Organization not found");
  }

  const organizationId = session.session.activeOrganizationId;

  await db
    .update(cardTestingTrackers)
    .set({
      blocked: false,
      suspicionScore: 0,
      recommendation: "ALLOW",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cardTestingTrackers.id, trackerId),
        eq(cardTestingTrackers.organizationId, organizationId)
      )
    );

  revalidatePath("/dashboard/card-testing");

  return { success: true };
}

/**
 * Get a single tracker by ID
 */
export async function getCardTestingTracker(trackerId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    throw new Error("Organization not found");
  }

  const organizationId = session.session.activeOrganizationId;

  const tracker = await db.query.cardTestingTrackers.findFirst({
    where: and(
      eq(cardTestingTrackers.id, trackerId),
      eq(cardTestingTrackers.organizationId, organizationId)
    ),
  });

  return tracker;
}

