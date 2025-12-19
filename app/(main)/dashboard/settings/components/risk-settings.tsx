"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

interface RiskSettingsProps {
  settings: {
    blockThreshold: number;
    reviewThreshold: number;
    require3DSScore: number;
    autoBlock: boolean;
    shadowMode: boolean;
  };
  errors: Record<string, string>;
  onUpdate: <K extends keyof RiskSettingsProps["settings"]>(
    key: K,
    value: RiskSettingsProps["settings"][K]
  ) => void;
}

export function RiskSettings({ settings, errors, onUpdate }: RiskSettingsProps) {
  return (
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
              min={0}
              max={100}
              value={settings.blockThreshold}
              onChange={(e) =>
                onUpdate("blockThreshold", parseInt(e.target.value) || 0)
              }
              className={`bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 ${
                errors.blockThreshold ? "border-red-500" : ""
              }`}
            />
            {errors.blockThreshold ? (
              <p className="text-xs text-red-400">{errors.blockThreshold}</p>
            ) : (
              <p className="text-xs text-zinc-500">
                Scores above this will be automatically blocked.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Review Threshold</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.reviewThreshold}
              onChange={(e) =>
                onUpdate("reviewThreshold", parseInt(e.target.value) || 0)
              }
              className={`bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 ${
                errors.reviewThreshold ? "border-red-500" : ""
              }`}
            />
            {errors.reviewThreshold ? (
              <p className="text-xs text-red-400">{errors.reviewThreshold}</p>
            ) : (
              <p className="text-xs text-zinc-500">
                Scores above this will be flagged for review.
              </p>
            )}
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
            checked={settings.autoBlock}
            onCheckedChange={(checked) => onUpdate("autoBlock", checked)}
            className="data-[state=checked]:bg-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-white">Shadow Mode</Label>
            <p className="text-sm text-zinc-400">
              Simulate actions without actually blocking or flagging (for testing)
            </p>
          </div>
          <Switch
            checked={settings.shadowMode}
            onCheckedChange={(checked) => onUpdate("shadowMode", checked)}
            className="data-[state=checked]:bg-indigo-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
