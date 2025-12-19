"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CustomerInvoice } from "autumn-js";
import { RiskSettings } from "./components/risk-settings";
import { NotificationSettings } from "./components/notification-settings";
import { BillingSettings } from "./components/billing-settings";

// Mock settings matching schema
const initialSettings = {
  blockThreshold: 80,
  reviewThreshold: 60,
  require3DSScore: 70,
  emailAlerts: true,
  autoBlock: true,
  shadowMode: false,
  slackWebhook: "https://hooks.slack.com/services/...",
  discordWebhook: "",
};

interface BillingData {
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
}

export function SettingsClient({ billing }: { billing: BillingData }) {
  console.log(billing, "billing");
  const { toast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};

    // Validate thresholds
    if (settings.blockThreshold < 0 || settings.blockThreshold > 100) {
      newErrors.blockThreshold = "Block threshold must be between 0 and 100";
    }
    if (settings.reviewThreshold < 0 || settings.reviewThreshold > 100) {
      newErrors.reviewThreshold = "Review threshold must be between 0 and 100";
    }
    if (settings.require3DSScore < 0 || settings.require3DSScore > 100) {
      newErrors.require3DSScore = "3DS threshold must be between 0 and 100";
    }
    if (settings.reviewThreshold >= settings.blockThreshold) {
      newErrors.reviewThreshold =
        "Review threshold must be lower than block threshold";
    }

    // Validate webhook URLs
    if (settings.slackWebhook && settings.slackWebhook.trim() !== "") {
      try {
        const url = new URL(settings.slackWebhook);
        if (!url.hostname.includes("slack.com")) {
          newErrors.slackWebhook = "Invalid Slack webhook URL";
        }
      } catch {
        newErrors.slackWebhook = "Invalid URL format";
      }
    }

    if (settings.discordWebhook && settings.discordWebhook.trim() !== "") {
      try {
        const url = new URL(settings.discordWebhook);
        if (!url.hostname.includes("discord.com")) {
          newErrors.discordWebhook = "Invalid Discord webhook URL";
        }
      } catch {
        newErrors.discordWebhook = "Invalid URL format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Replace with actual API call
      // await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });

      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof typeof initialSettings>(
    key: K,
    value: (typeof initialSettings)[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Type-safe wrapper for risk settings
  const updateRiskSetting = <
    K extends keyof Pick<
      typeof initialSettings,
      | "blockThreshold"
      | "reviewThreshold"
      | "require3DSScore"
      | "autoBlock"
      | "shadowMode"
    >,
  >(
    key: K,
    value: Pick<
      typeof initialSettings,
      | "blockThreshold"
      | "reviewThreshold"
      | "require3DSScore"
      | "autoBlock"
      | "shadowMode"
    >[K],
  ) => {
    updateSetting(key, value);
  };

  // Type-safe wrapper for notification settings
  const updateNotificationSetting = <
    K extends keyof Pick<
      typeof initialSettings,
      "emailAlerts" | "slackWebhook" | "discordWebhook"
    >,
  >(
    key: K,
    value: Pick<
      typeof initialSettings,
      "emailAlerts" | "slackWebhook" | "discordWebhook"
    >[K],
  ) => {
    updateSetting(key, value);
  };

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
        <Button
          className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
          onClick={handleSaveSettings}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="risk" className="relative z-10 space-y-6 max-w-5xl">
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
          <RiskSettings
            settings={{
              blockThreshold: settings.blockThreshold,
              reviewThreshold: settings.reviewThreshold,
              require3DSScore: settings.require3DSScore,
              autoBlock: settings.autoBlock,
              shadowMode: settings.shadowMode,
            }}
            errors={errors}
            onUpdate={updateRiskSetting}
          />
        </TabsContent>

        <TabsContent value="notifications" className="grid gap-8">
          <NotificationSettings
            settings={{
              emailAlerts: settings.emailAlerts,
              slackWebhook: settings.slackWebhook,
              discordWebhook: settings.discordWebhook,
            }}
            errors={errors}
            onUpdate={updateNotificationSetting}
          />
        </TabsContent>

        <TabsContent value="billing" className="grid gap-6">
          <BillingSettings billing={billing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
