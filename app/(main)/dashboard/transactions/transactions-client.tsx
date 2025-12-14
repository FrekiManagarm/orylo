"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download as DownloadIcon,
} from "lucide-react";
import { TransactionDetailsDrawer } from "./components/transaction-details-drawer";

// Mock data matching fraudAnalyses schema
const analyses = [
  {
    id: "fa_1",
    paymentIntentId: "pi_123456789",
    email: "john.doe@example.com",
    amount: 14900, // cents
    currency: "USD",
    riskScore: 92,
    action: "blocked",
    recommandation: "block",
    reasoning: "High velocity of transactions from same IP",
    ipAddress: "192.168.1.1",
    createdAt: "2024-03-10T14:30:00Z",
    country: "US",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    signals: {
      cardBrand: "visa",
      cardLast4: "4242",
      velocity_ip_1h: 12,
      velocity_card_24h: 3,
      distance_from_billing: 1200,
    },
    agentsUsed: ["velocity_check", "ip_reputation"],
    blocked: true,
    actualFraud: null,
    falsePositive: null,
  },
  {
    id: "fa_2",
    paymentIntentId: "pi_987654321",
    email: "sarah.m@company.com",
    amount: 29900,
    currency: "USD",
    riskScore: 15,
    action: "accepted",
    recommandation: "allow",
    reasoning: "Low risk factors",
    ipAddress: "10.0.0.1",
    createdAt: "2024-03-10T14:25:00Z",
    country: "FR",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    signals: {
      cardBrand: "mastercard",
      cardLast4: "8888",
      velocity_ip_1h: 1,
      velocity_card_24h: 1,
      cvc_check: "pass",
    },
    agentsUsed: ["rules_engine"],
    blocked: false,
    actualFraud: false,
    falsePositive: false,
  },
  {
    id: "fa_3",
    paymentIntentId: "pi_456123789",
    email: "suspicious@temp.mail",
    amount: 89900,
    currency: "USD",
    riskScore: 78,
    action: "review",
    recommandation: "review",
    reasoning: "Disposable email domain detected",
    ipAddress: "172.16.0.1",
    createdAt: "2024-03-10T14:15:00Z",
    country: "RU",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    signals: {
      cardBrand: "visa",
      cardLast4: "1234",
      email_domain_disposable: true,
      proxy_detected: true,
    },
    agentsUsed: ["email_risk", "proxy_detection"],
    blocked: false,
    actualFraud: null,
    falsePositive: null,
  },
];

const TransactionsClient = () => {
  const getScoreColor = (score: number) => {
    if (score < 30)
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score < 70)
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            Accepted
          </Badge>
        );
      case "blocked":
        return (
          <Badge
            variant="destructive"
            className="bg-rose-500/10 text-rose-400 border-rose-500/20"
          >
            Blocked
          </Badge>
        );
      case "review":
      case "3ds_required":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-400 border-orange-500/20"
          >
            Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-zinc-400">
            {action}
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  return (
    <div className="bg-black min-h-screen space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            Transactions
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Detailed breakdown of all processed transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by ID, email, or IP..."
              className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
            />
          </div>
          <Button
            variant="outline"
            className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl p-0 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-900/50 border-b border-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500 font-medium pl-6">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-zinc-500 font-medium">
                    User
                  </TableHead>
                  <TableHead className="text-zinc-500 font-medium">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                      Amount <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-zinc-500 font-medium">
                    Risk Score
                  </TableHead>
                  <TableHead className="text-zinc-500 font-medium">
                    Action
                  </TableHead>
                  <TableHead className="text-zinc-500 font-medium">
                    Reasoning
                  </TableHead>
                  <TableHead className="text-right text-zinc-500 font-medium">
                    Date
                  </TableHead>
                  <TableHead className="text-right text-zinc-500 font-medium pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow
                    key={analysis.id}
                    className="border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <TableCell className="font-mono text-xs text-zinc-400 group-hover:text-white pl-6">
                      {analysis.paymentIntentId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                          {analysis.email}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {analysis.ipAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300 font-medium">
                      {formatCurrency(analysis.amount, analysis.currency)}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold border ${getScoreColor(analysis.riskScore)}`}
                      >
                        {analysis.riskScore}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(analysis.action)}</TableCell>
                    <TableCell
                      className="text-zinc-400 text-sm max-w-[200px] truncate"
                      title={analysis.reasoning}
                    >
                      {analysis.reasoning}
                    </TableCell>
                    <TableCell className="text-right text-zinc-500 text-sm">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <TransactionDetailsDrawer analysis={analysis} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionsClient;
