import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { Organization, organization } from "./organization";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

export const alerts = pgTable("alerts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  type: text("type").notNull(), // high_risk_transaction, limit_reached, chargeback_detected
  severity: alertSeverityEnum("severity").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),

  relatedId: text("related_id"),
  metadata: jsonb("metadata"),

  read: boolean("read").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  organization: one(organization, {
    fields: [alerts.organizationId],
    references: [organization.id],
  }),
}));

export type Alert = InferSelectModel<typeof alerts> & {
  organization: Organization;
};

export const alertsInsertSchema = createInsertSchema(alerts);
export const alertsSelectSchema = createSelectSchema(alerts);
