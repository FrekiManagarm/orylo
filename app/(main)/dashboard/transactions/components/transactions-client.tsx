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
  ArrowUpDown,
  Download as DownloadIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { TransactionDetailsDrawer } from "./transaction-details-drawer";
import { useQueryStates } from "nuqs";
import { transactionsParsers } from "../searchParams";

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

type TransactionsClientProps = {
  initialAnalyses: FraudAnalysis[];
  initialTotalCount: number;
  initialPage: number;
  totalPages: number;
};

const TransactionsClient = ({
  initialAnalyses,
  initialTotalCount,
  initialPage,
  totalPages,
}: TransactionsClientProps) => {
  // Utiliser nuqs pour synchroniser l'état avec l'URL
  const [searchParams, setSearchParams] = useQueryStates(transactionsParsers, {
    history: "push",
    shallow: false, // Notifier le serveur pour recharger les données
  });

  const activeFiltersCount = () => {
    let count = 0;
    if (searchParams.riskScore) count++;
    if (searchParams.actions.length > 0) count++;
    if (searchParams.dateRange !== "all") count++;
    return count;
  };

  const resetFilters = () => {
    setSearchParams({
      page: 1,
      riskScore: null,
      actions: [],
      dateRange: "all",
      search: "",
    });
  };

  const handleActionFilterChange = (action: string, checked: boolean) => {
    const currentActions = searchParams.actions;
    if (checked) {
      setSearchParams({
        actions: [...currentActions, action as any],
        page: 1,
      });
    } else {
      setSearchParams({
        actions: currentActions.filter((a) => a !== action),
        page: 1,
      });
    }
  };

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
    <div className="bg-black space-y-8 relative overflow-hidden px-1">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Transactions
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Analyse détaillée de toutes les transactions traitées.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          {/* Top Bar: Search + Export */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Rechercher par ID, email, ou IP..."
                className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 h-10"
              />
            </div>
            <div className="flex items-center gap-3">
              {activeFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-zinc-400 hover:text-white hover:bg-white/5 h-10 px-4"
                >
                  <X className="h-3.5 w-3.5 mr-2" />
                  Réinitialiser
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 h-10 px-4"
              >
                <DownloadIcon className="h-3.5 w-3.5 mr-2" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Compact Filters Row */}
          <div className="flex items-center gap-6 text-sm">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              {[
                { value: "all", label: "Toutes", short: "All" },
                { value: "24h", label: "24h" },
                { value: "7d", label: "7j" },
                { value: "30d", label: "30j" },
              ].map((period, idx) => (
                <button
                  key={period.value}
                  onClick={() =>
                    setSearchParams({ dateRange: period.value as any, page: 1 })
                  }
                  className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${searchParams.dateRange === period.value
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                    } ${idx === 0 ? "rounded-l-md" : ""} ${idx === 3 ? "rounded-r-md" : ""
                    }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Risk Level Pills */}
            <div className="flex items-center gap-2">
              {[
                { value: null, label: "Tous", color: "default" },
                { value: "low", label: "Faible", color: "green" },
                { value: "medium", label: "Moyen", color: "orange" },
                { value: "high", label: "Élevé", color: "red" },
              ].map((risk) => (
                <button
                  key={risk.value || "all"}
                  onClick={() =>
                    setSearchParams({ riskScore: risk.value as any, page: 1 })
                  }
                  className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${searchParams.riskScore === risk.value
                    ? risk.color === "green"
                      ? "bg-emerald-500 text-white"
                      : risk.color === "orange"
                        ? "bg-orange-500 text-white"
                        : risk.color === "red"
                          ? "bg-rose-500 text-white"
                          : "bg-white text-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {risk.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Action Pills */}
            <div className="flex items-center gap-2">
              {[
                { value: "accepted", label: "Accepté", color: "green" },
                { value: "canceled", label: "Bloqué", color: "red" },
                { value: "3ds_required", label: "Révision", color: "orange" },
              ].map((action) => (
                <button
                  key={action.value}
                  onClick={() =>
                    handleActionFilterChange(
                      action.value,
                      !searchParams.actions.includes(action.value as any)
                    )
                  }
                  className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${searchParams.actions.includes(action.value as any)
                    ? action.color === "green"
                      ? "bg-emerald-500 text-white"
                      : action.color === "red"
                        ? "bg-rose-500 text-white"
                        : "bg-orange-500 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
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
                {initialAnalyses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-zinc-500 py-10"
                    >
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  initialAnalyses.map((analysis) => (
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
                        {analysis.createdAt
                          ? new Date(analysis.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <TransactionDetailsDrawer
                          analysis={{
                            ...analysis,
                            createdAt: analysis.createdAt?.toISOString() ?? "",
                            signals: analysis.signals as Record<string, any>,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="text-sm text-zinc-400">
              Page {initialPage} sur {totalPages} ({initialTotalCount}{" "}
              transactions au total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSearchParams({ page: Math.max(1, initialPage - 1) })
                }
                disabled={initialPage === 1}
                className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (initialPage <= 3) {
                    pageNum = i + 1;
                  } else if (initialPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = initialPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchParams({ page: pageNum })}
                      className={`w-9 h-9 p-0 ${initialPage === pageNum
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                        : "bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSearchParams({ page: Math.min(totalPages, initialPage + 1) })
                }
                disabled={initialPage === totalPages}
                className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsClient;
