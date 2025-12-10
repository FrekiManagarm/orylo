import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";
import { db } from "../db";
import { autumn } from "autumn-js/better-auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    autumn(),
    organization({
      schema: {
        organization: {
          additionalFields: {
            phoneNumber: {
              type: "string",
            },
            smsNotifications: {
              type: "boolean",
            },
            emailNotifications: {
              type: "boolean",
            },
            trialEndsAt: {
              type: "date",
            },
            trialStartedAt: {
              type: "date",
            },
          },
        },
      },
    }),
    twoFactor(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthOrganization = typeof auth.$Infer.Organization;
