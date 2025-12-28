import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Type for individual payment attempt
export interface CardTestingAttempt {
  cardFingerprint: string;
  cardLast4: string;
  cardBrand: string;
  paymentIntentId: string;
  status: "succeeded" | "failed";
  amount: number;
  currency: string;
  ipAddress?: string;
  timestamp: string; // ISO date string
}

// Reasons for suspicion (for visual explanations)
export interface SuspicionReason {
  label: string;
  description: string;
  weight: number; // How much this adds to the score
  severity: "low" | "medium" | "high";
}

/**
 * Card Testing Tracker
 * 
 * Tracks payment attempts grouped by session to detect card testing patterns.
 * Uses simple rule-based detection (no AI needed for MVP).
 */
export const cardTestingTrackers = pgTable(
  "card_testing_trackers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    // Session ID from checkout (e.g., cart ID, checkout session ID)
    sessionId: text("session_id").notNull(),
    
    // Array of all payment attempts for this session
    attempts: jsonb("attempts").$type<CardTestingAttempt[]>().default([]).notNull(),
    
    // Number of unique cards used in this session
    uniqueCards: integer("unique_cards").default(0).notNull(),
    
    // Suspicion score 0-100 (calculated by rules)
    suspicionScore: integer("suspicion_score").default(0).notNull(),
    
    // Reasons explaining the score (for visual explanations - USP)
    reasons: jsonb("reasons").$type<SuspicionReason[]>().default([]).notNull(),
    
    // Whether this session has been blocked
    blocked: boolean("blocked").default(false).notNull(),
    
    // Recommendation: ALLOW, REVIEW, BLOCK
    recommendation: text("recommendation").$type<"ALLOW" | "REVIEW" | "BLOCK">(),
    
    // Whether action was taken (refund, etc.)
    actionTaken: boolean("action_taken").default(false).notNull(),
    actionType: text("action_type"), // refunded, canceled, none
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("card_testing_org_session_idx").on(table.organizationId, table.sessionId),
    index("card_testing_score_idx").on(table.organizationId, table.suspicionScore),
    index("card_testing_blocked_idx").on(table.organizationId, table.blocked),
    unique("card_testing_org_session_unique").on(table.organizationId, table.sessionId),
  ]
);

export const cardTestingTrackersRelations = relations(cardTestingTrackers, ({ one }) => ({
  organization: one(organization, {
    fields: [cardTestingTrackers.organizationId],
    references: [organization.id],
  }),
}));

export type CardTestingTracker = InferSelectModel<typeof cardTestingTrackers>;
export type NewCardTestingTracker = InferInsertModel<typeof cardTestingTrackers>;

export const cardTestingTrackersInsertSchema = createInsertSchema(cardTestingTrackers);
export const cardTestingTrackersSelectSchema = createSelectSchema(cardTestingTrackers);
