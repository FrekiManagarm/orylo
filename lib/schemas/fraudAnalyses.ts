import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { Organization, organization } from "./organization";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const actionEnum = pgEnum("action", [
  "canceled",
  "refunded",
  "3ds_required",
  "accepted",
]);

export const fraudAnalyses = pgTable("fraud_analyses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  paymentIntentId: text("paymentIntentId").notNull().unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  email: text("email"),
  riskScore: integer("riskScore").notNull(),
  recommandation: text("recommandation").notNull(),
  reasoning: text("reasoning").notNull(),
  signals: jsonb("signals").notNull().default({}),
  agentsUsed: text("agentsUsed").array().notNull().default([]),
  blocked: boolean("blocked").notNull().default(false),
  action: actionEnum("action").notNull().default("accepted"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  country: text("country"),
  actualFraud: boolean("actualFraud"),
  falsePositive: boolean("falsePositive"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const fraudAnalysesRelations = relations(fraudAnalyses, ({ one }) => ({
  organization: one(organization, {
    fields: [fraudAnalyses.organizationId],
    references: [organization.id],
  }),
}));

export type FraudAnalysis = InferSelectModel<typeof fraudAnalyses> & {
  organization: Organization;
};
export type NewFraudAnalysis = InferInsertModel<typeof fraudAnalyses>;

export const fraudAnalysesInsertSchema = createInsertSchema(fraudAnalyses);
export const fraudAnalysesSelectSchema = createSelectSchema(fraudAnalyses);
