import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth.server";
import { getBillingData } from "@/lib/autumn";
import { SettingsClient } from "./settings-client";

const SettingsPage = async () => {
  // Get the current organization
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!org?.id) {
    redirect("/select-organization");
  }

  // Fetch real billing data from Autumn
  const billing = await getBillingData(org.id);

  return <SettingsClient billing={billing} />;
};

export default SettingsPage;
