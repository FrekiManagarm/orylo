import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { Organization, organization } from "./organization";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const settings = pgTable("settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  blockThreshold: integer("block_threshold").default(80).notNull(),
  reviewThreshold: integer("review_threshold").default(60).notNull(),
  require3DSScore: integer("require_3ds_score").default(70).notNull(),

  emailAlerts: boolean("email_alerts").default(true).notNull(),
  slackWebhook: text("slack_webhook"),
  discordWebhook: text("discord_webhook"),

  autoBlock: boolean("auto_block").default(true).notNull(),
  shadowMode: boolean("shadow_mode").default(false).notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  organization: one(organization, {
    fields: [settings.organizationId],
    references: [organization.id],
  }),
}));

export type Settings = InferSelectModel<typeof settings> & {
  organization: Organization;
};

export const settingsInsertSchema = createInsertSchema(settings);
export const settingsSelectSchema = createSelectSchema(settings);
