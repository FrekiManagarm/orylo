"use client";

import Link from "next/link";
import {
  Activity,
  ShieldAlert,
  DollarSign,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Settings,
  Plus,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Mock Data
const stats = [
  {
    title: "Transactions Analyzed",
    value: "1,247",
    change: "+12%",
    trend: "up",
    icon: Activity,
    description: "vs last month",
  },
  {
    title: "Frauds Blocked",
    value: "89",
    change: "+8%",
    trend: "up",
    icon: ShieldAlert,
    description: "vs last month",
    textColor: "text-red-600",
  },
  {
    title: "Money Saved",
    value: "$4,235",
    change: "+15%",
    trend: "up",
    icon: DollarSign,
    description: "vs last month",
    textColor: "text-green-600",
  },
  {
    title: "Avg Risk Score",
    value: "23",
    change: "-3%",
    trend: "down", // Good for risk score
    icon: Zap,
    description: "vs last month",
  },
];

const chartData = [
  { day: "Mon", total: 120, blocked: 5 },
  { day: "Tue", total: 145, blocked: 8 },
  { day: "Wed", total: 132, blocked: 4 },
  { day: "Thu", total: 198, blocked: 12 },
  { day: "Fri", total: 210, blocked: 15 },
  { day: "Sat", total: 160, blocked: 9 },
  { day: "Sun", total: 180, blocked: 7 },
];

const chartConfig = {
  total: {
    label: "Total Tx",
    color: "#818cf8",
  },
  blocked: {
    label: "Blocked",
    color: "#f43f5e",
  },
} satisfies ChartConfig;

const recentTransactions = [
  {
    id: "pi_12...34",
    email: "john.doe@example.com",
    amount: "$149.00",
    score: 92,
    status: "Blocked",
    time: "2 min ago",
  },
  {
    id: "pi_15...89",
    email: "sarah.m@company.com",
    amount: "$299.00",
    score: 15,
    status: "Accepted",
    time: "5 min ago",
  },
  {
    id: "pi_98...12",
    email: "suspicious@temp.mail",
    amount: "$899.00",
    score: 78,
    status: "Review",
    time: "12 min ago",
  },
  {
    id: "pi_45...67",
    email: "mike.ross@law.firm",
    amount: "$50.00",
    score: 5,
    status: "Accepted",
    time: "15 min ago",
  },
  {
    id: "pi_23...45",
    email: "rachel.z@design.co",
    amount: "$120.00",
    score: 25,
    status: "Accepted",
    time: "22 min ago",
  },
];

const DashboardHome = () => {
  const usagePercentage = 85;
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getScoreColor = (score: number) => {
    if (score < 30)
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score < 70)
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
          >
            Accepted
          </Badge>
        );
      case "Blocked":
        return (
          <Badge
            variant="destructive"
            className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
          >
            Blocked
          </Badge>
        );
      case "Review":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
          >
            Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-white/10 text-zinc-400">
            {status}
          </Badge>
        );
    }
  };

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
      <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-zinc-900/50 border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 group"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${stat.textColor || "text-white"}`}
              >
                {stat.value}
              </div>
              <div className="flex items-center text-xs text-zinc-500 mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-4 w-4 text-rose-500" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-emerald-500" : "text-rose-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1 opacity-70">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid gap-6 md:grid-cols-12">
        {/* Chart Section - Expanded to 8 columns */}
        <Card className="col-span-12 md:col-span-8 bg-zinc-900/50 border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-white">Transaction Activity</CardTitle>
              <CardDescription className="text-zinc-400">
                Analysis of traffic and threat detection
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pl-0">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-total)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-total)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="fillBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-blocked)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-blocked)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => value.slice(0, 3)}
                  stroke="#52525b"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  stroke="#52525b"
                  fontSize={12}
                />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      className="bg-zinc-900 border-white/10 text-white shadow-xl"
                      indicator="dot"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  fill="url(#fillTotal)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke="var(--color-blocked)"
                  fill="url(#fillBlocked)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Usage & Quick Actions Column - 4 columns */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          {/* Usage Card */}
          <Card className="border-white/5 backdrop-blur-xl relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-zinc-900/50 to-zinc-900/50">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-indigo-500" />
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">API Usage</CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                >
                  Pro Plan
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-white">
                    {usagePercentage}%
                  </span>
                  <span className="text-sm text-zinc-400 mb-1">
                    1,247 / 1,500
                  </span>
                </div>
                <Progress
                  value={usagePercentage}
                  className="h-2 bg-zinc-800 [&>div]:bg-indigo-500"
                />
              </div>

              <div className="text-sm text-zinc-400">
                <p>
                  Resets in{" "}
                  <span className="text-white font-medium">12 days</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  You're approaching your limit. Consider upgrading for
                  uninterrupted service.
                </p>
              </div>

              <Button className="w-full bg-white text-black hover:bg-zinc-200 transition-colors font-medium">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

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
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 border-white/5 hover:bg-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all group"
            >
              <Download className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-xs font-medium">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/2">
          <div className="space-y-1">
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-zinc-400">
              Live feed of processed payments and risk scores
            </CardDescription>
          </div>
          <Link href="/dashboard/transactions">
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-2"
            >
              View Full Report <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/2">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500 font-medium pl-6">
                  Transaction ID
                </TableHead>
                <TableHead className="text-zinc-500 font-medium">
                  User
                </TableHead>
                <TableHead className="text-zinc-500 font-medium">
                  Amount
                </TableHead>
                <TableHead className="text-zinc-500 font-medium">
                  Risk Score
                </TableHead>
                <TableHead className="text-zinc-500 font-medium">
                  Status
                </TableHead>
                <TableHead className="text-right text-zinc-500 font-medium pr-6">
                  Time
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <TableCell className="font-mono text-xs text-zinc-400 group-hover:text-white transition-colors pl-6">
                    {tx.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                        {tx.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-medium">
                    {tx.amount}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold border ${getScoreColor(tx.score)}`}
                    >
                      {tx.score}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="text-right text-zinc-500 text-sm pr-6">
                    {tx.time}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
