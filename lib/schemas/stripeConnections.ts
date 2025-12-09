import { InferSelectModel, relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { organization } from "./organization";

export const stripeConnections = pgTable("stripe_connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Stripe Account Info
  stripeAccountId: text("stripe_account_id").notNull().unique(),
  scope: text("scope").notNull(),

  // Encrypted tokens
  accessToken: text("access_token").notNull(), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted

  // Webhook configuration
  webhookEndpointId: text("webhook_endpoint_id"),
  webhookSecret: text("webhook_secret"), // Encrypted

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSyncAt: timestamp("last_sync_at"),
});

export const stripeConnectionsRelations = relations(
  stripeConnections,
  ({ one }) => ({
    organization: one(organization, {
      fields: [stripeConnections.organizationId],
      references: [organization.id],
    }),
  }),
);

export type StripeConnection = InferSelectModel<typeof stripeConnections>;

export const stripeConnectionsInsertSchema =
  createInsertSchema(stripeConnections);
export const stripeConnectionsSelectSchema =
  createSelectSchema(stripeConnections);
