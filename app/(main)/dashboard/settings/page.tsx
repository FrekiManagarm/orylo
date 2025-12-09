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
import { Save, Bell, Shield, Webhook } from "lucide-react";

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

      <div className="relative z-10 grid gap-8 max-w-4xl">
        {/* Risk Thresholds */}
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
                  className="bg-zinc-900/50 border-white/10 text-white"
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
                  className="bg-zinc-900/50 border-white/10 text-white"
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

        {/* Notifications */}
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
                  className="bg-zinc-900/50 border-white/10 text-white font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Discord Webhook URL</Label>
                <Input
                  defaultValue={settings.discordWebhook}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="bg-zinc-900/50 border-white/10 text-white font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
