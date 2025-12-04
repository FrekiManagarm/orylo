import { InferSelectModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { session } from "./session";
import { account } from "./account";
import { member } from "./member";
import { invitation } from "./invitation";
import { twoFactor } from "./twoFactor";
import { createSelectSchema } from "drizzle-zod";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  twoFactors: many(twoFactor),
}));

export type User = InferSelectModel<typeof user> & {
  sessions: Session[];
  accounts: Account[];
  members: Member[];
  invitations: Invitation[];
  twoFactors: TwoFactor[];
};

export const SelectUserSchema = createSelectSchema(user);
