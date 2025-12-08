import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { listTypeEnum } from "./whitelistEntries";
import { Organization, organization } from "./organization";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const blacklistEntries = pgTable("blacklist_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  type: listTypeEnum("type").notNull(),
  value: text("value").notNull(),
  reason: text("reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const blacklistEntriesRelations = relations(
  blacklistEntries,
  ({ one }) => ({
    organization: one(organization, {
      fields: [blacklistEntries.organizationId],
      references: [organization.id],
    }),
  }),
);

export type BlacklistEntry = InferSelectModel<typeof blacklistEntries> & {
  organization: Organization;
};

export const blacklistEntriesInsertSchema =
  createInsertSchema(blacklistEntries);
export const blacklistEntriesSelectSchema =
  createSelectSchema(blacklistEntries);
