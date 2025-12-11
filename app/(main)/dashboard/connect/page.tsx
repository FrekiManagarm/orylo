import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth.server";
import { Organization } from "@/lib/schemas";

import { ConnectStripeCard } from "./connect-stripe-card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stripe Connect | Orylo",
  description:
    "Connect your Stripe account to analyze transactions and prevent fraud in real-time.",
};

const ConnectPage = async () => {
  const requestHeaders = await headers();

  const [session, organizations] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.listOrganizations({ headers: requestHeaders }),
  ]);

  if (!session) {
    redirect("/sign-in");
  }

  const orgList = (organizations ?? []) as Organization[];

  if (orgList.length === 0) {
    redirect("/create-organization");
  }

  const organization = orgList[0];

  return (
    <div className="bg-black min-h-screen space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Connect
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage your payment provider integrations.
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl">
        <ConnectStripeCard organizationId={organization.id} />
      </div>
    </div>
  );
};

export default ConnectPage;
