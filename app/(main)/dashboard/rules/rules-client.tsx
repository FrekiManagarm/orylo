"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const RulesClient = () => {
  const getActionColor = (action: string) => {
    switch (action) {
      case "block":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "review":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "require_3ds":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      default:
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  return (
    <div className="bg-black min-h-screen space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] -translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Rules Engine
          </h1>
          <p className="text-zinc-400 mt-1">
            Configure automated decision logic for incoming transactions.
          </p>
        </div>
        <Button className="bg-white text-black hover:bg-zinc-200">
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="relative z-10 grid gap-6">
        {rules.map((rule) => (
          <Card
            key={rule.id}
            className="bg-zinc-900/50 border-white/5 backdrop-blur-xl transition-all hover:border-white/10 group"
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg text-white">
                    {rule.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`border ${getActionColor(rule.action)}`}
                  >
                    {rule.action.toUpperCase().replace("_", " ")}
                  </Badge>
                  {!rule.enabled && (
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-500"
                    >
                      Disabled
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-zinc-400">
                  {rule.description}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-500 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-zinc-900 border-white/10 text-zinc-300"
                >
                  <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-rose-500/10 focus:text-rose-400 text-rose-500 cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-zinc-500 mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <span>
                    Priority:{" "}
                    <span className="text-zinc-300">{rule.priority}</span>
                  </span>
                  <span>
                    Last updated:{" "}
                    <span className="text-zinc-300">
                      {new Date(rule.updatedAt).toLocaleDateString()}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold">
                    Active
                  </span>
                  <Switch
                    checked={rule.enabled}
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RulesClient;
