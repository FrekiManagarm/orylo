"use client";

import { JSX, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ConnectionStatus = {
  id: string;
  stripeAccountId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  webhookEndpointId: string | null;
};

type StatusResponse = {
  organizationId: string;
  connection: ConnectionStatus | null;
};

type ConnectStripeCardProps = {
  organizationId: string;
};

export function ConnectStripeCard({
  organizationId,
}: ConnectStripeCardProps): JSX.Element {
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/stripe/connect/status?organizationId=${organizationId}`,
        {
          cache: "no-store",
        },
      );

      if (!res.ok) {
        throw new Error("Impossible de récupérer le statut Stripe.");
      }

      const data = (await res.json()) as StatusResponse;
      setConnection(data.connection);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue côté client.";
      setError(message);
      toast.error("Erreur", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [organizationId]);

  const handleConnect = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!res.ok) {
        throw new Error("Impossible de démarrer la connexion Stripe.");
      }

      const data = (await res.json()) as { url?: string };

      if (!data.url) {
        throw new Error("URL de redirection Stripe manquante.");
      }

      // Redirection vers Stripe OAuth
      window.location.href = data.url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue côté client.";
      setError(message);
      toast.error("Erreur", { description: message });
    } finally {
      setIsStarting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!res.ok) {
        throw new Error("Impossible de déconnecter Stripe.");
      }

      const data = (await res.json()) as { success?: boolean };

      if (!data.success) {
        throw new Error("La déconnexion a échoué côté serveur.");
      }

      toast.success("Compte Stripe déconnecté.");
      await loadStatus();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue côté client.";
      setError(message);
      toast.error("Erreur", { description: message });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isActive = connection?.isActive;

  return (
    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Stripe Integration
          {isActive ? (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              Active
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-zinc-800 text-zinc-400 border-white/10"
            >
              Inactive
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Connect your Stripe account to analyze transactions and prevent fraud
          in real-time.
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
              {isActive
                ? `Connected to ${connection?.stripeAccountId}`
                : "Not connected"}
            </p>
            {error && (
              <p className="text-xs text-rose-400 mt-2">{error}</p>
            )}
          </div>
          {isActive ? (
            <Button
              variant="destructive"
              className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
              onClick={handleDisconnect}
              disabled={isDisconnecting || isLoading}
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect
            </Button>
          ) : (
            <Button
              className="bg-[#635BFF] hover:bg-[#635BFF]/90 text-white"
              onClick={handleConnect}
              disabled={isStarting || isLoading}
            >
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Connect Stripe
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Récupération du statut…</span>
          </div>
        )}

        {isActive && !isLoading && (
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
                {connection?.lastSyncAt
                  ? new Date(connection.lastSyncAt).toLocaleString()
                  : "Unknown"}
              </p>
              <Button
                variant="link"
                className="h-auto p-0 text-indigo-400 text-xs mt-2"
                onClick={loadStatus}
                disabled={isLoading}
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
                Endpoint: {connection?.webhookEndpointId || "Not configured"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
