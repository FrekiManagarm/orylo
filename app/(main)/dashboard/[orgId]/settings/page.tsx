"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bell, Shield, Webhook, CreditCard } from "lucide-react";

// Mock settings matching schema
const settings = {
  blockThreshold: 80,
  reviewThreshold: 60,
  require3DSScore: 70,
  emailAlerts: true,
  autoBlock: true,
  shadowMode: false,
  slackWebhook: "https://hooks.slack.com/services/...",
  discordWebhook: "",
};

const billing = {
  plan: "Pro",
  price: "120 €/mois",
  nextInvoice: "15 décembre 2025",
  usage: {
    transactions: 12000,
    limit: 20000,
  },
  paymentMethod: "Visa •••• 4242",
};

const invoices = [
  { id: "INV-2025-11", date: "15 novembre 2025", amount: "120 €", status: "Payée" },
  { id: "INV-2025-10", date: "15 octobre 2025", amount: "120 €", status: "Payée" },
];

const SettingsPage = () => {
  return (
    <div className="bg-black min-h-screen space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Settings
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage global risk thresholds and notification channels.
          </p>
        </div>
        <Button className="bg-white text-black hover:bg-zinc-200">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs
        defaultValue="risk"
        className="relative z-10 space-y-6 max-w-5xl"
      >
        <TabsList className="bg-zinc-900/60 border border-white/5 rounded-xl p-1 w-full md:w-auto">
          <TabsTrigger
            value="risk"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg px-4 py-2 transition"
          >
            Risques
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg px-4 py-2 transition"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg px-4 py-2 transition"
          >
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="grid gap-8">
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-white">Risk Thresholds</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Define score limits for automated actions. Scores range from 0
                (safe) to 100 (fraud).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Block Threshold</Label>
                  <Input
                    type="number"
                    defaultValue={settings.blockThreshold}
                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Scores above this will be automatically blocked.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Review Threshold</Label>
                  <Input
                    type="number"
                    defaultValue={settings.reviewThreshold}
                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                  />
                  <p className="text-xs text-zinc-500">
                    Scores above this will be flagged for review.
                  </p>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Auto Block</Label>
                  <p className="text-sm text-zinc-400">
                    Automatically block transactions exceeding the block threshold
                  </p>
                </div>
                <Switch
                  defaultChecked={settings.autoBlock}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Shadow Mode</Label>
                  <p className="text-sm text-zinc-400">
                    Simulate actions without actually blocking or flagging (for
                    testing)
                  </p>
                </div>
                <Switch
                  defaultChecked={settings.shadowMode}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="grid gap-8">
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-white">Notifications</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Configure where you receive critical alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Email Alerts</Label>
                  <p className="text-sm text-zinc-400">
                    Receive daily digests and critical security alerts
                  </p>
                </div>
                <Switch
                  defaultChecked={settings.emailAlerts}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Webhook className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">
                    Integrations
                  </span>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Slack Webhook URL</Label>
                  <Input
                    defaultValue={settings.slackWebhook}
                    placeholder="https://hooks.slack.com/..."
                    className="bg-zinc-900/50 border-white/10 text-white font-mono text-sm placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Discord Webhook URL</Label>
                  <Input
                    defaultValue={settings.discordWebhook}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="bg-zinc-900/50 border-white/10 text-white font-mono text-sm placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="grid gap-6">
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
                  <p className="text-sm text-zinc-500">
                    Inclut 20k vérifications mensuelles et 3 environnements.
                  </p>
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
                  <span className="text-sm text-zinc-400">
                    Transactions utilisées
                  </span>
                  <span className="text-sm text-white">
                    {billing.usage.transactions.toLocaleString("fr-FR")} /{" "}
                    {billing.usage.limit.toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${Math.min((billing.usage.transactions / billing.usage.limit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-zinc-500">
                  Renouvellement mensuel le 1er de chaque mois.
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
                      {billing.paymentMethod}
                    </p>
                  </div>
                  <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10">
                    Mettre à jour la carte
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>Prochaine facture</span>
                  <span className="text-white">{billing.nextInvoice}</span>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Historique des factures</p>
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {invoice.id}
                        </p>
                        <p className="text-xs text-zinc-500">{invoice.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white">
                          {invoice.amount}
                        </span>
                        <span className="text-xs text-emerald-400">
                          {invoice.status}
                        </span>
                        <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10 px-3">
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
