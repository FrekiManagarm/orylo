import { db } from "@/lib/db";
import { webhookLogs } from "@/lib/schemas/webhookLogs";
import { eq, and, lt } from "drizzle-orm";
import { organization } from "../schemas";

export async function retryFailedWebhooks() {
  const failedWebhooks = await db.query.webhookLogs.findMany({
    where: and(eq(webhookLogs.processed, false), lt(webhookLogs.retryCount, 3)),
    orderBy: (logs, { asc }) => [asc(logs.createdAt)],
    limit: 10,
  });

  console.log(`🔄 Retrying ${failedWebhooks.length} failed webhooks`);

  for (const log of failedWebhooks) {
    try {
      const client = await db.query.organization.findFirst({
        where: eq(organization.id, log.organizationId),
        with: {
          settings: true,
        },
      });

      if (!client) continue;

      const event = {
        type: log.eventType,
        data: { object: log.payload },
        id: log.eventId,
      };

      if (log.eventType === "payment_intent.created") {
        // await handlePaymentIntentCreated(event as any, client);
      }
    } catch (error) {}
  }
}
