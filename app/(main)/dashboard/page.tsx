"use client";

import {
  Activity,
  ShieldAlert,
  DollarSign,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
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
    label: "Total Transactions",
    color: "hsl(var(--primary))",
  },
  blocked: {
    label: "Blocked",
    color: "hsl(var(--destructive))",
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
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (score < 70)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
          >
            Accepted
          </Badge>
        );
      case "Blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      case "Review":
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800"
          >
            Review
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-black space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
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
        <div className="flex items-center gap-2 text-sm text-zinc-500 border border-white/10 px-3 py-1 rounded-full bg-zinc-900/50 backdrop-blur-sm">
          {currentDate}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-zinc-900/50 border-white/10 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-zinc-500" />
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
                <span className="ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid gap-4 md:grid-cols-7">
        {/* Usage Card */}
        <Card className="col-span-7 md:col-span-3 bg-zinc-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Usage This Month</CardTitle>
              <Badge
                variant="secondary"
                className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
              >
                Growth Plan
              </Badge>
            </div>
            <CardDescription className="text-zinc-400">
              1,247 / 10,000 transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Progress</span>
                <span className="font-medium text-white">
                  {usagePercentage}%
                </span>
              </div>
              <Progress
                value={usagePercentage}
                className="h-2 bg-zinc-800 [&>div]:bg-indigo-500"
              />
              <div className="rounded-lg border border-white/5 p-3 bg-white/5 text-sm">
                <p className="text-zinc-400">
                  Your quota resets in 12 days. Upgrade to Enterprise for
                  unlimited transactions.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-white text-black hover:bg-zinc-200">
              Upgrade Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Chart */}
        <Card className="col-span-7 md:col-span-4 bg-zinc-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Transaction Activity</CardTitle>
            <CardDescription className="text-zinc-400">
              Overview of analyzed vs blocked transactions for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                  stroke="#71717a"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="#71717a"
                />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                  content={
                    <ChartTooltipContent className="bg-zinc-900 border-white/10 text-white" />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  stroke="var(--color-blocked)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="relative z-10 grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2 bg-zinc-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription className="text-zinc-400">
                Latest 10 transactions analyzed
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500">ID</TableHead>
                  <TableHead className="text-zinc-500">Email</TableHead>
                  <TableHead className="text-zinc-500">Amount</TableHead>
                  <TableHead className="text-zinc-500">Score</TableHead>
                  <TableHead className="text-zinc-500">Status</TableHead>
                  <TableHead className="text-right text-zinc-500">
                    Time
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-medium text-zinc-300">
                      {tx.id}
                    </TableCell>
                    <TableCell className="text-zinc-400">{tx.email}</TableCell>
                    <TableCell className="text-zinc-300">{tx.amount}</TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getScoreColor(tx.score)}`}
                      >
                        {tx.score}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-right text-zinc-500">
                      {tx.time}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
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

        {/* Quick Actions */}
        <Card className="col-span-1 bg-zinc-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-zinc-400">
              Common tasks and configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              className="w-full justify-start bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new rule
            </Button>
            <Button
              className="w-full justify-start bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20"
              variant="outline"
            >
              <Activity className="mr-2 h-4 w-4" />
              View all transactions
            </Button>
            <Button
              className="w-full justify-start bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20"
              variant="outline"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure alerts
            </Button>
            <Button
              className="w-full justify-start bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
