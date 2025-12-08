import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const ruleActionEnum = pgEnum("rule_action", [
  "block",
  "review",
  "require_3ds",
  "alert_only",
]);

export const rules = pgTable("rules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  conditions: jsonb("conditions").notNull().default({}),
  action: ruleActionEnum("action").notNull(),
  threshold: integer("threshold"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const rulesRelations = relations(rules, ({ one }) => ({
  organization: one(organization, {
    fields: [rules.organizationId],
    references: [organization.id],
  }),
}));

export type Rule = InferSelectModel<typeof rules> & {
  organization: InferSelectModel<typeof organization>;
};
export type NewRule = InferInsertModel<typeof rules>;

export const rulesInsertSchema = createInsertSchema(rules);
export const rulesSelectSchema = createSelectSchema(rules);
