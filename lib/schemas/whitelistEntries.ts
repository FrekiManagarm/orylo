import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { Organization, organization } from "./organization";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const listTypeEnum = pgEnum("list_type", [
  "email",
  "ip",
  "country",
  "card_bin",
]);

export const whitelistEntries = pgTable("whitelist_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  type: listTypeEnum("type").notNull(),
  value: text("value").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export const whitelistEntriesRelations = relations(
  whitelistEntries,
  ({ one }) => ({
    organization: one(organization, {
      fields: [whitelistEntries.organizationId],
      references: [organization.id],
    }),
  }),
);

export type WhitelistEntry = InferSelectModel<typeof whitelistEntries> & {
  organization: Organization;
};
export type NewWhitelistEntry = InferInsertModel<typeof whitelistEntries>;

export const whitelistEntriesInsertSchema =
  createInsertSchema(whitelistEntries);
export const whitelistEntriesSelectSchema =
  createSelectSchema(whitelistEntries);
