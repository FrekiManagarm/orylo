"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ban,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Globe,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardTestingTracker, CardTestingAttempt } from "@/lib/schemas/cardTestingTrackers";
import { unblockSession } from "@/lib/actions/card-testing";
import { useRouter } from "next/navigation";

interface CardTestingStats {
  totalBlocked: number;
  totalSuspicious: number;
  totalSessions: number;
  last24hBlocked: number;
}

interface CardTestingClientProps {
  initialTrackers: CardTestingTracker[];
  stats: CardTestingStats;
}

const CardTestingClient = ({ initialTrackers, stats }: CardTestingClientProps) => {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "blocked" | "suspicious">("all");

  const filteredTrackers = initialTrackers.filter((tracker) => {
    if (filter === "blocked") return tracker.blocked;
    if (filter === "suspicious") return tracker.suspicionScore >= 40 && !tracker.blocked;
    return true;
  });

  const handleUnblock = async (trackerId: string) => {
    await unblockSession(trackerId);
    router.refresh();
  };

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-indigo-400" />
            Card Testing Detection
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Monitor and block card testing fraud attempts in real-time.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.refresh()}
          className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Blocked (24h)"
          value={stats.last24hBlocked}
          icon={<Ban className="w-5 h-5" />}
          color="rose"
        />
        <StatCard
          title="Total Blocked"
          value={stats.totalBlocked}
          icon={<ShieldAlert className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Suspicious"
          value={stats.totalSuspicious}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          title="Sessions Analyzed"
          value={stats.totalSessions}
          icon={<Activity className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </FilterButton>
        <FilterButton
          active={filter === "blocked"}
          onClick={() => setFilter("blocked")}
        >
          Blocked
        </FilterButton>
        <FilterButton
          active={filter === "suspicious"}
          onClick={() => setFilter("suspicious")}
        >
          Suspicious
        </FilterButton>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredTrackers.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filteredTrackers.map((tracker) => (
            <SessionCard
              key={tracker.id}
              tracker={tracker}
              expanded={expandedId === tracker.id}
              onToggle={() => setExpandedId(expandedId === tracker.id ? null : tracker.id)}
              onUnblock={() => handleUnblock(tracker.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "rose" | "orange" | "yellow" | "indigo";
}) {
  const colorClasses = {
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="text-2xl font-semibold text-white mt-1">{value}</p>
        </div>
        <div className={cn("p-2 rounded-lg border", colorClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "transition-all",
        active
          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
          : "bg-zinc-900/50 text-zinc-400 border border-white/5 hover:text-white hover:bg-white/5"
      )}
    >
      {children}
    </Button>
  );
}

function SessionCard({
  tracker,
  expanded,
  onToggle,
  onUnblock,
}: {
  tracker: CardTestingTracker;
  expanded: boolean;
  onToggle: () => void;
  onUnblock: () => void;
}) {
  const attempts = tracker.attempts || [];
  const uniqueCards = tracker.uniqueCards;
  const score = tracker.suspicionScore;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (score >= 40) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  const getRecommendationBadge = (rec?: string | null) => {
    switch (rec) {
      case "BLOCK":
        return <Badge variant="destructive">BLOCKED</Badge>;
      case "REVIEW":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">REVIEW</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">ALLOWED</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border transition-all duration-300",
        tracker.blocked
          ? "bg-rose-950/20 border-rose-500/20"
          : score >= 40
            ? "bg-orange-950/10 border-orange-500/20"
            : "bg-zinc-900/50 border-white/10"
      )}
    >
      {/* Score Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full",
          score >= 70 ? "bg-rose-500" : score >= 40 ? "bg-orange-500" : "bg-emerald-500"
        )}
      />

      {/* Main Content */}
      <div className="p-5 pl-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "mt-1 p-2 rounded-lg border shrink-0",
                getScoreColor(score)
              )}
            >
              <CreditCard className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-medium text-white font-mono">
                  {tracker.sessionId.length > 30
                    ? `${tracker.sessionId.slice(0, 15)}...${tracker.sessionId.slice(-10)}`
                    : tracker.sessionId}
                </h3>
                {getRecommendationBadge(tracker.recommendation)}
                {tracker.actionTaken && (
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                    {tracker.actionType === "refunded" ? "Refunded" : "Action Taken"}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {uniqueCards} card{uniqueCards !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {attempts.length} attempt{attempts.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(tracker.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {tracker.aiAnalysis && (
                <p className="text-sm text-zinc-400 mt-2 max-w-xl">
                  {tracker.aiAnalysis}
                </p>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Score Badge */}
            <div
              className={cn(
                "px-3 py-1.5 rounded-lg border text-sm font-medium",
                getScoreColor(score)
              )}
            >
              Score: {score}/100
            </div>

            {/* Actions */}
            {tracker.blocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnblock}
                className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Unblock
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-zinc-400 hover:text-white"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && attempts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Payment Attempts Timeline
            </h4>
            <div className="space-y-2">
              {attempts.map((attempt, idx) => (
                <AttemptRow key={idx} attempt={attempt} index={idx + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AttemptRow({ attempt, index }: { attempt: CardTestingAttempt; index: number }) {
  const statusColor = {
    succeeded: "text-emerald-400 bg-emerald-500/10",
    failed: "text-rose-400 bg-rose-500/10",
    requires_action: "text-yellow-400 bg-yellow-500/10",
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/30 border border-white/5">
      <span className="text-xs text-zinc-600 w-6">#{index}</span>
      
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-zinc-500" />
        <span className="text-sm text-zinc-300 font-mono">
          •••• {attempt.cardLast4}
        </span>
        <span className="text-xs text-zinc-500">{attempt.cardBrand}</span>
      </div>

      <div className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColor[attempt.status])}>
        {attempt.status}
      </div>

      <span className="text-sm text-zinc-400">
        {(attempt.amount / 100).toFixed(2)} {attempt.currency?.toUpperCase()}
      </span>

      {attempt.ipAddress && (
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          <Globe className="w-3 h-3" />
          {attempt.ipAddress}
        </span>
      )}

      <span className="text-xs text-zinc-600 ml-auto">
        {new Date(attempt.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-zinc-900/50 border border-white/10 mb-4">
        <ShieldAlert className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        No {filter !== "all" ? filter : ""} sessions found
      </h3>
      <p className="text-sm text-zinc-400 max-w-sm">
        {filter === "blocked"
          ? "No card testing attempts have been blocked yet."
          : filter === "suspicious"
            ? "No suspicious activity detected recently."
            : "Card testing detection is active. Sessions will appear here when analyzed."}
      </p>
    </div>
  );
}

export default CardTestingClient;

