import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { Organization, organization } from "./organization";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const webhookLogs = pgTable("webhook_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventId: text("event_id").notNull().unique(),
  payload: jsonb("payload").notNull(),
  response: jsonb("response"),
  statusCode: integer("status_code"),
  processed: boolean("processed").default(false).notNull(),
  error: text("error"),
  retryCount: integer("retry_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  organization: one(organization, {
    fields: [webhookLogs.organizationId],
    references: [organization.id],
  }),
}));

export type WebhookLog = InferSelectModel<typeof webhookLogs> & {
  organization: Organization;
};

export const webhookLogsInsertSchema = createInsertSchema(webhookLogs);
export const webhookLogsSelectSchema = createSelectSchema(webhookLogs);
