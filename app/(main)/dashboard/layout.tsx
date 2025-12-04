import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>{children}</SidebarProvider>
  );
};

export default DashboardLayout;
