import { Invitation, Member } from "better-auth/plugins";
import { InferSelectModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { member } from "./member";
import { invitation } from "./invitation";

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export type Organization = InferSelectModel<typeof organization> & {
  members: Member[];
  invitations: Invitation[];
};
