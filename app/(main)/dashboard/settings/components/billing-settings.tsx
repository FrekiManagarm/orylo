"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";
import { CustomerInvoice } from "autumn-js";

interface BillingSettingsProps {
  billing: {
    plan: string;
    price: string;
    interval: string;
    nextInvoice: string | null;
    invoices: CustomerInvoice[];
    usage: {
      transactions: number;
      limit: number;
    };
    paymentMethod: unknown;
    status: string;
  };
}

export function BillingSettings({ billing }: BillingSettingsProps) {
  const limit = billing.usage.limit ?? 0;
  const balance = billing.usage.transactions ?? 0;
  const used = limit - balance;
  const usagePercentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  return (
    <div className="grid gap-6">
      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-white">Facturation</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Suivez votre plan, votre consommation et vos paiements.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Plan actuel</p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-white">
                  {billing.plan}
                </span>
                <span className="text-zinc-400">{billing.price}</span>
              </div>
              <p className="text-sm text-zinc-500">Statut: {billing.status}</p>
            </div>
            <div className="space-x-3">
              <Button className="bg-white text-black hover:bg-zinc-200">
                Mettre à niveau
              </Button>
              <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10">
                Voir les limites
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Transactions utilisées</span>
              <span className="text-sm text-white">
                {used.toLocaleString("fr-FR")} / {limit.toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isOverLimit
                    ? "bg-rose-500"
                    : isNearLimit
                      ? "bg-orange-500"
                      : "bg-indigo-500"
                }`}
                style={{
                  width: `${Math.min(usagePercentage, 100)}%`,
                }}
              />
            </div>
            <div className="text-xs text-zinc-500">
              {isOverLimit ? (
                <p className="text-rose-400">
                  ⚠️ Vous avez atteint votre limite. Passez à un plan supérieur pour continuer.
                </p>
              ) : isNearLimit ? (
                <p className="text-orange-400">
                  Vous approchez de votre limite ({balance} transaction{balance > 1 ? "s" : ""} restante{balance > 1 ? "s" : ""}).
                </p>
              ) : (
                <p>
                  {balance} transaction{balance > 1 ? "s" : ""} restante{balance > 1 ? "s" : ""} ce mois-ci. Renouvellement mensuel le 1er de chaque mois.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Méthode de paiement</p>
                <p className="text-white font-medium">
                  {billing.paymentMethod
                    ? JSON.stringify(billing.paymentMethod)
                    : "Aucune méthode de paiement"}
                </p>
              </div>
              <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10">
                Mettre à jour la carte
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>Prochaine facture</span>
              <span className="text-white">{billing.nextInvoice || "N/A"}</span>
            </div>
          </div>

          <Separator className="bg-white/5" />

          <div className="space-y-3">
            <p className="text-sm text-zinc-400">Historique des factures</p>
            {billing.invoices && billing.invoices.length > 0 ? (
              <div className="space-y-2">
                {billing.invoices.map((invoice) => {
                  const date = new Date(invoice.created_at * 1000);
                  const formattedDate = date.toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                  const amount = (invoice.total / 100).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: invoice.currency,
                  });
                  const statusMap = {
                    paid: { label: "Payée", color: "text-emerald-400" },
                    open: { label: "En attente", color: "text-orange-400" },
                    draft: { label: "Brouillon", color: "text-zinc-400" },
                    void: { label: "Annulée", color: "text-red-400" },
                    uncollectible: { label: "Impayée", color: "text-red-400" },
                  };
                  const statusInfo = statusMap[invoice.status as keyof typeof statusMap] || {
                    label: invoice.status,
                    color: "text-zinc-400",
                  };

                  return (
                    <div
                      key={invoice.stripe_id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {invoice.stripe_id}
                        </p>
                        <p className="text-xs text-zinc-500">{formattedDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white">{amount}</span>
                        <span className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {invoice.hosted_invoice_url && (
                          <Button
                            asChild
                            className="bg-white/5 text-white hover:bg-white/10 border border-white/10 px-3"
                          >
                            <a
                              href={invoice.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Voir
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-white/5 bg-zinc-950/50 px-4 py-8 text-center">
                <p className="text-sm text-zinc-400">Aucune facture disponible</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
