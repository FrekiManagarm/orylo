import { pgTable, text, index } from "drizzle-orm/pg-core";
import { User, user } from "./user";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("twoFactor_secret_idx").on(table.secret),
    index("twoFactor_userId_idx").on(table.userId),
  ],
);

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export type TwoFactor = InferSelectModel<typeof twoFactor> & {
  user: User;
};

export const SelectTwoFactorSchema = createSelectSchema(twoFactor);
export const InsertTwoFactorSchema = createInsertSchema(twoFactor);
