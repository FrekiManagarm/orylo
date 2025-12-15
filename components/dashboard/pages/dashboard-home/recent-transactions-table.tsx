import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFraudAnalyses } from "@/lib/actions/fraud-analyses";

type FraudAnalysis = {
  id: string;
  paymentIntentId: string;
  email: string | null;
  amount: number;
  currency: string;
  riskScore: number;
  action: "canceled" | "refunded" | "3ds_required" | "accepted";
  recommandation: string;
  reasoning: string;
  ipAddress: string | null;
  createdAt: Date | null;
  country: string | null;
  userAgent: string | null;
  signals: any;
  agentsUsed: string[];
  blocked: boolean;
  actualFraud: boolean | null;
  falsePositive: boolean | null;
  organizationId: string;
};

const RecentTransactionsTable = async ({
  recentAnalyses,
}: {
  recentAnalyses: FraudAnalysis[];
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "N/A";

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return "Just now";
  };

  const getScoreColor = (score: number) => {
    if (score < 30)
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score < 70)
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  const getStatusBadge = (action: string, blocked: boolean) => {
    if (blocked) {
      return (
        <Badge
          variant="destructive"
          className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
        >
          Blocked
        </Badge>
      );
    }

    switch (action) {
      case "accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
          >
            Accepted
          </Badge>
        );
      case "3ds_required":
      case "review":
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
            {action}
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl overflow-hidden p-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between border-white/5 bg-white/2 p-5">
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
      <CardContent className="p-0 border-t border-white/5">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500 font-medium pl-6">
                Transaction ID
              </TableHead>
              <TableHead className="text-zinc-500 font-medium">User</TableHead>
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
            {recentAnalyses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-zinc-400 py-8"
                >
                  No transactions yet
                </TableCell>
              </TableRow>
            ) : (
              recentAnalyses.map((analysis) => (
                <TableRow
                  key={analysis.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <TableCell className="font-mono text-xs text-zinc-400 group-hover:text-white transition-colors pl-6">
                    {analysis.paymentIntentId}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                        {analysis.email || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-medium">
                    {formatCurrency(analysis.amount, analysis.currency)}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold border ${getScoreColor(analysis.riskScore)}`}
                    >
                      {analysis.riskScore}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(analysis.action, analysis.blocked)}
                  </TableCell>
                  <TableCell className="text-right text-zinc-500 text-sm pr-6">
                    {formatTimeAgo(analysis.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/transactions`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTransactionsTable;
