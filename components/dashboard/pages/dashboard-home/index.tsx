import Link from "next/link";
import {
  Download,
  Settings,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionActivityChart } from "./transaction-activity-chart";
import { StatsGrid } from "./stats-grid";
import RecentTransactionsTable from "./recent-transactions-table";
import { UsageCard } from "@/components/usage-card";
import { SimulatePaymentButton } from "@/components/dashboard/pages/dashboard-home/simulate-payment-button";


const DashboardClient = async () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-black space-y-8 relative overflow-hidden min-h-screen">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] -translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Overview
          </h1>
          <p className="text-zinc-400 mt-1">
            Monitor your fraud protection in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 border border-white/10 px-4 py-2 rounded-full bg-zinc-900/50 backdrop-blur-sm shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {currentDate}
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Main Content Grid */}
      <div className="relative z-10 grid gap-6 md:grid-cols-12">
        {/* Chart Section - Expanded to 8 columns */}
        <TransactionActivityChart />

        {/* Usage & Quick Actions Column - 4 columns */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          {/* Usage Card */}
          <UsageCard />

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/rules" className="block">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 border-white/5 hover:bg-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all group"
              >
                <Plus className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-medium">New Rule</span>
              </Button>
            </Link>
            <Link href="/dashboard/settings" className="block">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 border-white/5 hover:bg-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all group"
              >
                <Settings className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-medium">Config</span>
              </Button>
            </Link>
            <Link href="/dashboard/alerts" className="block">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 border-white/5 hover:bg-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all group"
              >
                <ShieldAlert className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-medium">Threats</span>
              </Button>
            </Link>
            <SimulatePaymentButton />
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactionsTable />
    </div>
  );
};

export default DashboardClient;
