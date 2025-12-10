import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies, headers } from "next/headers";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/layout/dashboard-header";
import { auth } from "@/lib/auth/auth.server";
import { Organization } from "@/lib/schemas";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value === "true";

  const [session, organizations] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.listOrganizations({
      headers: await headers(),
    }),
  ]);

  if (!session) {
    redirect("/sign-in");
  }

  const organizationsList = (organizations ?? []) as Organization[];

  if (!organizationsList.length) {
    redirect("/create-organization");
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex w-screen h-screen">
        <DashboardSidebar session={session} organizations={organizationsList} />
        <SidebarInset>
          <DashboardHeader />
          <div className="w-full overflow-y-auto p-4 mb-4">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
