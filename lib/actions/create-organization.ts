"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/auth.server";

type CreateOrganizationInput = {
  name: string;
  slug: string;
  logo?: string | null;
};

export async function createOrganizationAction(
  values: CreateOrganizationInput,
): Promise<{ error: string } | { organization: unknown }> {
  try {
    const organization = await auth.api.createOrganization({
      body: {
        name: values.name,
        slug: values.slug,
        logo: values.logo || undefined,
        phoneNumber: "",
        smsNotifications: false,
        emailNotifications: false,
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        trialStartedAt: new Date(),
        keepCurrentActiveOrganization: false,
      },
      headers: await headers(),
    });

    revalidatePath("/dashboard");

    return { organization };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de créer l'organisation.";
    return { error: message };
  }
}
