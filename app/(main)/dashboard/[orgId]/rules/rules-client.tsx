"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  MoreVertical,
  Edit,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateRuleDialog } from "./create-rule-dialog";
import { useActiveOrganization } from "@/lib/auth/auth.client";
import { cn } from "@/lib/utils";

// Mock data matching rules schema
const rules = [
  {
    id: "rule_1",
    name: "High Value Transactions",
    description: "Flag transactions over $1,000 for review",
    enabled: true,
    priority: 10,
    action: "review",
    conditions: { field: "amount", operator: "gt", value: 100000 },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-01T15:30:00Z",
  },
  {
    id: "rule_2",
    name: "Block Banned Countries",
    description: "Automatically block transactions from high-risk countries",
    enabled: true,
    priority: 100,
    action: "block",
    conditions: { field: "country", operator: "in", value: ["XX", "YY"] },
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "rule_3",
    name: "Suspicious IP Velocity",
    description: "Require 3DS if > 5 transactions from IP in 1 hour",
    enabled: false,
    priority: 50,
    action: "require_3ds",
    conditions: { field: "velocity_ip_1h", operator: "gt", value: 5 },
    createdAt: "2024-02-20T11:00:00Z",
    updatedAt: "2024-02-25T14:00:00Z",
  },
];

const ActionBadge = ({ action }: { action: string }) => {
  switch (action) {
    case "block":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3" />
          Block
        </div>
      );
    case "review":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-medium uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          Review
        </div>
      );
    case "require_3ds":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-medium uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" />
          3D Secure
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
          <Shield className="w-3 h-3" />
          Alert
        </div>
      );
  }
};

const RulesClient = () => {
  const { data: activeOrganization } = useActiveOrganization();

  return (
    <div className="min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Decision rules
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Configure the automatic decision logic for your transactions.
          </p>
        </div>
        {activeOrganization?.id && (
          <CreateRuleDialog organizationId={activeOrganization.id} />
        )}
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="group relative overflow-hidden rounded-lg border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 p-2 rounded-lg border",
                    rule.action === "block"
                      ? "bg-rose-500/5 border-rose-500/10 text-rose-500"
                      : rule.action === "review"
                        ? "bg-orange-500/5 border-orange-500/10 text-orange-500"
                        : rule.action === "require_3ds"
                          ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-500"
                          : "bg-zinc-500/5 border-zinc-500/10 text-zinc-500",
                  )}
                >
                  {rule.action === "block" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : rule.action === "review" ? (
                    <Clock className="w-5 h-5" />
                  ) : rule.action === "require_3ds" ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">
                      {rule.name}
                    </h3>
                    <ActionBadge action={rule.action} />
                    {!rule.enabled && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">{rule.description}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                    <span className="font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">
                      {rule.conditions.field} {rule.conditions.operator}{" "}
                      {Array.isArray(rule.conditions.value)
                        ? rule.conditions.value.join(", ")
                        : rule.conditions.value}
                    </span>
                    <span>•</span>
                    <span>Priorité {rule.priority}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:pl-4 sm:border-l sm:border-white/5">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      rule.enabled ? "text-zinc-300" : "text-zinc-600",
                    )}
                  >
                    {rule.enabled ? "Actif" : "Inactif"}
                  </span>
                  <Switch
                    checked={rule.enabled}
                    className="data-[state=checked]:bg-indigo-500 h-5 w-9"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-zinc-900 border-white/5 text-zinc-400 min-w-[160px]"
                  >
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer text-xs">
                      <Edit className="mr-2 h-3.5 w-3.5" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-rose-500/10 focus:text-rose-400 text-rose-500 cursor-pointer text-xs">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RulesClient;
