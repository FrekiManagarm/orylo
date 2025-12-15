"use client";

import { JSX, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type ConnectionStatus = {
  id: string;
  stripeAccountId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  webhookEndpointId: string | null;
  createdAt: string;
};

type StatusResponse = {
  organizationId: string;
  connections: ConnectionStatus[];
};

type ConnectStripeCardProps = {
  organizationId: string;
};

export function ConnectStripeCard({
  organizationId,
}: ConnectStripeCardProps): JSX.Element {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [disconnectingIds, setDisconnectingIds] = useState<Set<string>>(
    new Set(),
  );
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
      // Filter only active connections or show inactive ones differently?
      // Usually we want to show active ones.
      setConnections(
        (data.connections || []).filter((c) => c.isActive !== false),
      );
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
      setIsStarting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingIds((prev) => new Set(prev).add(connectionId));
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, connectionId }),
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
      setDisconnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-white flex items-center gap-2">
              Stripe Integration
              <Badge
                variant="secondary"
                className="bg-zinc-800 text-zinc-400 border-white/10"
              >
                {connections.length} connected
              </Badge>
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Connect your Stripe accounts to analyze transactions and prevent
              fraud in real-time.
            </CardDescription>
          </div>
          <Button
            className="bg-[#635BFF] hover:bg-[#635BFF]/90 text-white"
            onClick={handleConnect}
            disabled={isStarting || isLoading}
            size="sm"
          >
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Connect Account
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading connections...
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-lg bg-white/5">
            <div className="h-12 w-12 rounded bg-[#635BFF]/20 text-[#635BFF] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              S
            </div>
            <h3 className="text-white font-medium mb-1">
              No accounts connected
            </h3>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto mb-6">
              Connect your first Stripe account to start analyzing your
              transactions.
            </p>
            <Button
              className="bg-[#635BFF] hover:bg-[#635BFF]/90 text-white"
              onClick={handleConnect}
              disabled={isStarting}
            >
              {isStarting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Connect Stripe
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="rounded-lg bg-white/5 border border-white/5 overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-[#635BFF] flex items-center justify-center text-white font-bold text-lg shrink-0">
                      S
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">
                          {connection.stripeAccountId}
                        </h3>
                        {connection.isActive && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 h-5"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Added on{" "}
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                      onClick={() => handleDisconnect(connection.id)}
                      disabled={disconnectingIds.has(connection.id)}
                    >
                      {disconnectingIds.has(connection.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="bg-black/20 px-4 py-3 border-t border-white/5 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                        <RefreshCw className="h-3 w-3" />
                        Last Synced
                      </div>
                      <span className="text-zinc-300">
                        {connection.lastSyncAt
                          ? new Date(connection.lastSyncAt).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Webhook
                      </div>
                      <span className="text-zinc-300 truncate block">
                        {connection.webhookEndpointId || "Not configured"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
