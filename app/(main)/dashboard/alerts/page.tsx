"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";

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

const AlertsPage = () => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-rose-500/20 bg-rose-500/5";
      case "warning":
        return "border-orange-500/20 bg-orange-500/5";
      case "info":
        return "border-blue-500/20 bg-blue-500/5";
      default:
        return "border-zinc-500/20 bg-zinc-500/5";
    }
  };

  return (
    <div className="bg-black min-h-screen space-y-8 p-8 md:p-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Alerts
          </h1>
          <p className="text-zinc-400 mt-1">
            System notifications and critical updates.
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:text-white"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="relative z-10 grid gap-4 max-w-4xl">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`backdrop-blur-xl transition-all hover:border-white/20 ${getSeverityColor(alert.severity)} ${!alert.read ? "border-l-4" : "border-white/5 opacity-70"}`}
          >
            <CardContent className="p-6 flex items-start gap-4">
              <div className="mt-1 shrink-0">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold ${!alert.read ? "text-white" : "text-zinc-400"}`}
                  >
                    {alert.title}
                  </h3>
                  <span className="text-xs text-zinc-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{alert.message}</p>
                <div className="pt-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/40 text-zinc-400 border-none text-[10px] uppercase tracking-wider"
                  >
                    {alert.type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-white -mr-2 -mt-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;
