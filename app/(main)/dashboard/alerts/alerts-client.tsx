"use client";

import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Bell,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data matching alerts schema
const alerts = [
  {
    id: "alert_1",
    type: "high_risk_transaction",
    severity: "critical",
    title: "High Risk Transaction Detected",
    message:
      "Transaction pi_123... detected with risk score 92 (Threshold: 80)",
    read: false,
    createdAt: "2024-03-10T14:30:00Z",
  },
  {
    id: "alert_2",
    type: "chargeback_detected",
    severity: "warning",
    title: "Chargeback Warning",
    message:
      "Potential chargeback risk for transaction pi_987... based on user history.",
    read: true,
    createdAt: "2024-03-09T10:15:00Z",
  },
  {
    id: "alert_3",
    type: "limit_reached",
    severity: "info",
    title: "API Usage Limit Approaching",
    message: "You have used 85% of your monthly API calls limit.",
    read: false,
    createdAt: "2024-03-08T09:00:00Z",
  },
];

const AlertsClient = () => {
  return (
    <div className="min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            Alertes système
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Notifications critiques et mises à jour de sécurité.
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Tout marquer comme lu
        </Button>
      </div>

      <div className="grid gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "group relative overflow-hidden rounded-lg border transition-all duration-300",
              alert.read
                ? "bg-zinc-900/20 border-white/5 opacity-60 hover:opacity-100"
                : "bg-zinc-900/50 border-white/10",
            )}
          >
            {/* Unread Indicator */}
            {!alert.read && (
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            )}

            <div className="flex flex-col sm:flex-row sm:items-start justify-between p-5 gap-4 pl-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 p-2 rounded-lg border shrink-0",
                    alert.severity === "critical"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                      : alert.severity === "warning"
                        ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-500",
                  )}
                >
                  {alert.severity === "critical" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : alert.severity === "warning" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={cn(
                        "text-sm font-medium",
                        alert.read ? "text-zinc-300" : "text-white",
                      )}
                    >
                      {alert.title}
                    </h3>

                    {/* Severity Badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                        alert.severity === "critical"
                          ? "bg-rose-500/5 border-rose-500/10 text-rose-400"
                          : alert.severity === "warning"
                            ? "bg-orange-500/5 border-orange-500/10 text-orange-400"
                            : "bg-blue-500/5 border-blue-500/10 text-blue-400",
                      )}
                    >
                      {alert.severity}
                    </div>

                    {!alert.read && (
                      <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.createdAt).toLocaleDateString()} à{" "}
                      {new Date(alert.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="font-mono text-zinc-600">
                      ID: {alert.id.split("_")[1]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:pl-4 sm:border-l sm:border-white/5 self-start h-full min-h-[50px]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsClient;
