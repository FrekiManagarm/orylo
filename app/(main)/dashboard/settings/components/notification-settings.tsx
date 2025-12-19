"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Webhook } from "lucide-react";

interface NotificationSettingsProps {
  settings: {
    emailAlerts: boolean;
    slackWebhook: string;
    discordWebhook: string;
  };
  errors: Record<string, string>;
  onUpdate: <K extends keyof NotificationSettingsProps["settings"]>(
    key: K,
    value: NotificationSettingsProps["settings"][K]
  ) => void;
}

export function NotificationSettings({ settings, errors, onUpdate }: NotificationSettingsProps) {
  return (
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
            checked={settings.emailAlerts}
            onCheckedChange={(checked) => onUpdate("emailAlerts", checked)}
            className="data-[state=checked]:bg-indigo-500"
          />
        </div>

        <Separator className="bg-white/5" />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Webhook className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Integrations</span>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Slack Webhook URL</Label>
            <Input
              value={settings.slackWebhook}
              onChange={(e) => onUpdate("slackWebhook", e.target.value)}
              placeholder="https://hooks.slack.com/..."
              className={`bg-zinc-900/50 border-white/10 text-white font-mono text-sm placeholder:text-zinc-500 focus-visible:ring-indigo-500 ${
                errors.slackWebhook ? "border-red-500" : ""
              }`}
            />
            {errors.slackWebhook && (
              <p className="text-xs text-red-400">{errors.slackWebhook}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Discord Webhook URL</Label>
            <Input
              value={settings.discordWebhook}
              onChange={(e) => onUpdate("discordWebhook", e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className={`bg-zinc-900/50 border-white/10 text-white font-mono text-sm placeholder:text-zinc-500 focus-visible:ring-indigo-500 ${
                errors.discordWebhook ? "border-red-500" : ""
              }`}
            />
            {errors.discordWebhook && (
              <p className="text-xs text-red-400">{errors.discordWebhook}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
