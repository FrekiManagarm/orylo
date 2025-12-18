"use client";

import { Button } from "@/components/ui/button";
import {
  CreditCard,
  ShieldAlert,
  Activity,
  User,
  ShieldCheck,
  Shield,
  Eye,
  Globe,
  Monitor,
  Code2,
  Bot,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TransactionDetailsDrawerProps {
  analysis: {
    id: string;
    paymentIntentId: string;
    email: string | null;
    amount: number;
    currency: string;
    riskScore: number;
    action: string;
    recommandation: string;
    reasoning: string;
    ipAddress: string | null;
    createdAt: string | Date;
    country: string | null;
    userAgent: string | null;
    signals: Record<string, any>;
    agentsUsed: string[];
    blocked: boolean;
    actualFraud: boolean | null;
    falsePositive: boolean | null;
  };
}

const getActionBadge = (action: string) => {
  switch (action) {
    case "accepted":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <ShieldCheck className="mr-1 h-3 w-3" />
          Accepted
        </Badge>
      );
    case "blocked":
      return (
        <Badge
          variant="destructive"
          className="bg-rose-500/10 text-rose-400 border-rose-500/20"
        >
          <ShieldAlert className="mr-1 h-3 w-3" />
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
          <Shield className="mr-1 h-3 w-3" />
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

export function TransactionDetailsDrawer({
  analysis,
}: TransactionDetailsDrawerProps) {
  // Extract card info from signals if available
  const cardBrand = analysis.signals?.cardBrand;
  const cardLast4 = analysis.signals?.cardLast4;

  const hasSignals =
    analysis.signals && Object.keys(analysis.signals).length > 0;

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-500 hover:text-white hover:bg-white/5 h-8 w-8"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-[400px] border-l border-white/10 bg-zinc-950 text-white">
        <DrawerHeader className="border-b border-white/5 px-6 py-6">
          <DrawerTitle className="text-xl font-medium">
            Transaction Details
          </DrawerTitle>
          <DrawerDescription className="text-zinc-400">
            Detailed analysis for {analysis.paymentIntentId}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Score Section */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-white/5">
            <div className="space-y-1">
              <span className="text-sm text-zinc-400">Fraud Risk Score</span>
              <div className="flex items-center gap-2">
                <Activity
                  className={cn(
                    "h-4 w-4",
                    analysis.riskScore >= 70
                      ? "text-rose-500"
                      : analysis.riskScore >= 30
                        ? "text-orange-500"
                        : "text-emerald-500",
                  )}
                />
                <span
                  className={cn(
                    "text-2xl font-bold",
                    analysis.riskScore >= 70
                      ? "text-rose-500"
                      : analysis.riskScore >= 30
                        ? "text-orange-500"
                        : "text-emerald-500",
                  )}
                >
                  {analysis.riskScore}/100
                </span>
              </div>
            </div>
            <div className="text-right">{getActionBadge(analysis.action)}</div>
          </div>

          {/* Payment Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-zinc-400" />
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Amount</span>
                <p className="text-sm text-zinc-200">
                  {formatCurrency(analysis.amount, analysis.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Card</span>
                <p className="text-sm text-zinc-200 capitalize flex items-center gap-1">
                  {cardBrand || "Unknown"} •••• {cardLast4 || "????"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Date</span>
                <p className="text-sm text-zinc-200">
                  {new Date(analysis.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              Customer
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">Email</span>
                <span className="text-sm text-zinc-200">{analysis.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400">IP Address</span>
                <span className="text-sm text-zinc-200">
                  {analysis.ipAddress}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Country
                </span>
                <span className="text-sm text-zinc-200">
                  {analysis.country || "Unknown"}
                </span>
              </div>
              <div className="flex flex-col gap-1 py-2 border-b border-white/5">
                <span className="text-sm text-zinc-400 flex items-center gap-1">
                  <Monitor className="h-3 w-3" /> User Agent
                </span>
                <span className="text-xs text-zinc-300 break-all font-mono">
                  {analysis.userAgent || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-400" />
              Risk Analysis
            </h3>
            <div className="p-4 rounded-lg bg-zinc-900 border border-white/5">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {analysis.reasoning}
              </p>
            </div>
          </div>

          {/* Technical Signals */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Code2 className="h-4 w-4 text-zinc-400" />
              Technical Signals
            </h3>
            {hasSignals ? (
              <div className="p-4 rounded-lg bg-zinc-900 border border-white/5 space-y-2">
                {Object.entries(analysis.signals).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-zinc-500 font-mono">{key}</span>
                    <span className="text-zinc-300 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-zinc-900 border border-white/5">
                <Empty className="p-4 border-none gap-2">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-zinc-800 text-zinc-400 size-8 [&_svg]:size-4"
                    >
                      <Code2 />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm text-zinc-300">
                      No signals
                    </EmptyTitle>
                  </EmptyHeader>
                  <EmptyDescription className="text-xs text-zinc-500">
                    No technical signals were collected for this transaction.
                  </EmptyDescription>
                </Empty>
              </div>
            )}
          </div>

          {/* Agents Used */}
          {analysis.agentsUsed && analysis.agentsUsed.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Bot className="h-4 w-4 text-zinc-400" />
                Agents Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.agentsUsed.map((agent) => (
                  <Badge
                    key={agent}
                    variant="outline"
                    className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs font-normal"
                  >
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-white/5 bg-zinc-900/30 px-6 py-4">
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="w-full bg-zinc-900 border-white/10 hover:bg-white/5 text-zinc-300"
            >
              Close Details
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
