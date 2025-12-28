import { Metadata } from "next";
import RulesClient from "./rules-client";
import { getRulesByOrganization } from "@/lib/actions/rules";
import { auth } from "@/lib/auth/auth.server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Rules | Orylo",
  description:
    "Create and manage rules to analyze transactions and prevent fraud in real-time.",
};

const RulesPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    redirect("/select-organization");
  }

  const { data: rules } = await getRulesByOrganization(
    session.session.activeOrganizationId
  );

  return <RulesClient initialRules={rules || []} />;
};

export default RulesPage;
