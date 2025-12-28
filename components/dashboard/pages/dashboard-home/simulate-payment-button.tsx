"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Zap, Store } from "lucide-react";
import { simulatePaymentIntent } from "@/lib/actions/simulate-payment";
import { getStripeConnections } from "@/lib/actions/stripe-connections";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface StripeConnection {
  id: string;
  stripeAccountId: string;
  accountName: string | null;
  isActive: boolean;
}

export function SimulatePaymentButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [riskLevel, setRiskLevel] =
    useState<"low" | "medium" | "high">("medium");
  const { toast } = useToast();

  // Load Stripe connections with useQuery
  const {
    data: connections = [],
    isLoading: loadingConnections,
    error,
  } = useQuery<StripeConnection[]>({
    queryKey: ["stripe-connections"],
    queryFn: getStripeConnections,
    enabled: isOpen, // Only fetch when dialog is open
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Auto-select the first active connection when data loads
  useEffect(() => {
    if (connections.length > 0 && !selectedAccountId) {
      const firstActive = connections.find((c) => c.isActive);
      if (firstActive) {
        setSelectedAccountId(firstActive.stripeAccountId);
      }
    }
  }, [connections, selectedAccountId]);

  const handleSimulate = async () => {
    if (!selectedAccountId) {
      toast({
        title: "⚠️ Compte requis",
        description: "Veuillez sélectionner un compte Stripe",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await simulatePaymentIntent({
        riskLevel,
        stripeAccountId: selectedAccountId,
      });

      if (result.success && result.sessionUrl) {
        toast({
          title: "✅ Checkout Session créée",
          description: "Redirection vers la page de paiement...",
        });
        // Rediriger vers la page de checkout Stripe
        window.location.href = result.sessionUrl;
      } else {
        toast({
          title: "❌ Erreur",
          description: result.error || "Impossible de créer la session",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const selectedConnection = connections.find(
    (c) => c.stripeAccountId === selectedAccountId
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 border-white/5 hover:bg-white/5 hover:border-indigo-500/30 hover:text-indigo-400 transition-all group"
        >
          <Zap className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
          <span className="text-xs font-medium">Test Payment</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            Simuler une Checkout Session
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Créez une session de paiement Stripe pour tester votre système de
            détection de fraude.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stripe Account Selector */}
          <div className="space-y-2">
            <label
              htmlFor="stripe-account"
              className="text-sm font-medium text-zinc-300"
            >
              Compte Stripe
            </label>
            {loadingConnections ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                <span className="ml-2 text-sm text-zinc-400">
                  Chargement des comptes...
                </span>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">
                  Erreur lors du chargement des comptes Stripe
                </p>
              </div>
            ) : connections.length === 0 ? (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-sm text-amber-400">
                  Aucun compte Stripe connecté. Connectez d&apos;abord votre
                  compte dans les paramètres.
                </p>
              </div>
            ) : (
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="bg-zinc-800 border-white/10 text-white">
                  <SelectValue placeholder="Sélectionner un compte">
                    {selectedConnection && (
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-indigo-400" />
                        <span>
                          {selectedConnection.accountName ||
                            `Account ${selectedConnection.stripeAccountId.slice(-8)}`}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-white/10">
                  {connections
                    .filter((c) => c.isActive)
                    .map((connection) => (
                      <SelectItem
                        key={connection.id}
                        value={connection.stripeAccountId}
                        className="text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-indigo-400" />
                          <div className="flex flex-col">
                            <span>
                              {connection.accountName || "Unnamed Account"}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {connection.stripeAccountId.slice(0, 21)}...
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Risk Level Selector */}
          <div className="space-y-2">
            <label
              htmlFor="risk-level"
              className="text-sm font-medium text-zinc-300"
            >
              Niveau de risque
            </label>
            <Select
              value={riskLevel}
              onValueChange={(value: "low" | "medium" | "high") =>
                setRiskLevel(value)
              }
            >
              <SelectTrigger className="bg-zinc-800 border-white/10 text-white">
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-white/10">
                <SelectItem value="low" className="text-white">
                  🟢 Faible risque - Client de confiance
                </SelectItem>
                <SelectItem value="medium" className="text-white">
                  🟡 Risque moyen - Nouveau client
                </SelectItem>
                <SelectItem value="high" className="text-white">
                  🔴 Risque élevé - Transaction suspecte
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-zinc-800/50 border border-white/5 p-4 space-y-2">
            <h4 className="text-sm font-medium text-zinc-300">
              À propos de cette simulation
            </h4>
            <ul className="text-xs text-zinc-400 space-y-1">
              <li>• Une checkout session sera créée dans votre compte Stripe</li>
              <li>
                • Vous serez redirigé vers la page de paiement Stripe
              </li>
              <li>
                • Utilisez une carte de test : 4242 4242 4242 4242
              </li>
              <li>
                • Votre système d&apos;analyse de fraude traitera le payment
                intent
              </li>
              <li>
                • Les données sont générées selon le niveau de risque choisi
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="bg-zinc-800 border-white/10 hover:bg-zinc-700"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSimulate}
            disabled={isLoading || connections.length === 0 || !selectedAccountId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Créer la session de paiement
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
