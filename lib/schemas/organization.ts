import { Invitation, Member } from "better-auth/plugins";
import { InferSelectModel, relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { member } from "./member";
import { invitation } from "./invitation";
import { fraudAnalyses, FraudAnalysis } from "./fraudAnalyses";
import { Rule, rules } from "./rules";
import { whitelistEntries, WhitelistEntry } from "./whitelistEntries";
import { blacklistEntries, BlacklistEntry } from "./blacklistEntries";
import { WebhookLog, webhookLogs } from "./webhookLogs";
import { Alert, alerts } from "./alerts";
import { settings } from "./settings";

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
  phoneNumber: text("phone_number"),
  smsNotifications: boolean("sms_notifications").default(false).notNull(),
  emailNotifications: boolean("email_notifications").default(false).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  trialStartedAt: timestamp("trial_started_at"),
});

export const organizationRelations = relations(
  organization,
  ({ many, one }) => ({
    members: many(member),
    invitations: many(invitation),
    fraudAnalyses: many(fraudAnalyses),
    rules: many(rules),
    whitelistEntries: many(whitelistEntries),
    blacklistEntries: many(blacklistEntries),
    webhookLogs: many(webhookLogs),
    alerts: many(alerts),
    settings: one(settings, {
      fields: [organization.id],
      references: [settings.organizationId],
    }),
  }),
);

export type Organization = InferSelectModel<typeof organization> & {
  members: Member[];
  invitations: Invitation[];
  fraudAnalyses: FraudAnalysis[];
  rules: Rule[];
  whitelistEntries: WhitelistEntry[];
  blacklistEntries: BlacklistEntry[];
  webhookLogs: WebhookLog[];
  alerts: Alert[];
};
