import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";
import { db } from "../db";
import { autumn } from "autumn-js/better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    autumn({
      secretKey: process.env.AUTUMN_SECRET_KEY,
      customerScope: "organization",
      identify: async (req) => {
        if (!req.organization) {
          throw new Error("Organization not found");
        }

        return {
          customerId: req.organization.id,
          customerData: {
            ...req.organization,
          },
        };
      },
    }),
    organization({
      schema: {
        organization: {
          additionalFields: {
            phoneNumber: {
              type: "string",
              required: false,
            },
            smsNotifications: {
              type: "boolean",
              required: false,
            },
            emailNotifications: {
              type: "boolean",
              required: false,
            },
            trialEndsAt: {
              type: "date",
              required: false,
            },
            trialStartedAt: {
              type: "date",
              required: false,
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
