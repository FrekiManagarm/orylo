import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies, headers } from "next/headers";
import { Metadata } from "next";
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

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <DashboardSidebar
        session={session!}
        organizations={organizations! as Organization[]}
      />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
