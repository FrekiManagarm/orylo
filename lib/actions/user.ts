"use server";

import { headers } from "next/headers";
import { auth } from "../auth/auth.server";

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("User not found");
  }

  return session?.user;
}

export async function getOrganization() {
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!org?.id) {
    throw new Error("Organization not found");
  }

  return org;
}
