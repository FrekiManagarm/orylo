import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient({
      schema: {
        organization: {
          additionalFields: {
            smsNotifications: {
              type: "boolean",
              required: false,
            },
            phoneNumber: {
              type: "string",
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
    twoFactorClient(),
  ],
});

export const {
  signIn,
  signUp,
  useSession,
  signOut,
  resetPassword,
  requestPasswordReset,
  useActiveOrganization,
  organization,
} = authClient;
