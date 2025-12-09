"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RefreshCw } from "lucide-react";

// Mock data based on stripeConnections schema
const connection = {
  id: "conn_123",
  stripeAccountId: "acct_123456789",
  isActive: true,
  createdAt: "2024-01-01T12:00:00Z",
  lastSyncAt: "2024-03-10T15:00:00Z",
};

const ConnectPage = () => {
  return (
    <div className="bg-black min-h-screen space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Connect
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage your payment provider integrations.
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl">
        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Stripe Integration
              {connection.isActive ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-400"
                >
                  Inactive
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Connect your Stripe account to analyze transactions and prevent
              fraud in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
              <div className="h-12 w-12 rounded bg-[#635BFF] flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Stripe Account</h3>
                <p className="text-sm text-zinc-400">
                  {connection.isActive
                    ? `Connected to ${connection.stripeAccountId}`
                    : "Not connected"}
                </p>
              </div>
              {connection.isActive ? (
                <Button
                  variant="destructive"
                  className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                >
                  Disconnect
                </Button>
              ) : (
                <Button className="bg-[#635BFF] hover:bg-[#635BFF]/90 text-white">
                  Connect Stripe
                </Button>
              )}
            </div>

            {connection.isActive && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-white">
                      Sync Status
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Last synced:{" "}
                    {new Date(connection.lastSyncAt).toLocaleString()}
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-indigo-400 text-xs mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Sync Now
                  </Button>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-white">
                      Webhooks
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Listening for payment_intent.created, charge.succeeded
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConnectPage;
