"use client";

import { motion } from "framer-motion";
import { Check, Zap, Gift, TrendingUp, Crown, X } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "FREE",
    price: "0",
    description: "Perfect to get started and test.",
    limits: [
      "100 analyzed transactions/mo",
      "7-day history",
      "0 custom rules",
      "1 basic AI agent",
      "No API access",
      "No webhooks",
      "Standard email support",
    ],
    features: [
      "Basic risk score",
      "Simple dashboard",
      "Auto-block if score > 90",
      "Email alerts",
    ],
    cta: "Start for free",
    popular: false,
    icon: Gift,
  },
  {
    name: "STARTER",
    price: "99",
    description: "For growing projects.",
    limits: [
      "1,000 transactions/mo",
      "30-day history",
      "3 custom rules",
      "2 AI agents (basic + geo)",
      "No API access",
      "No webhooks",
      "Priority email support",
    ],
    features: [
      "Everything in Free +",
      "Advanced AI analysis (GPT-4)",
      "Geo detection (IP vs card)",
      "Configurable auto-block",
      "Detailed email alerts",
      "Basic CSV export",
    ],
    cta: "Start trial",
    popular: false,
    icon: Zap,
  },
  {
    name: "GROWTH",
    price: "299",
    description: "For scaling businesses.",
    limits: [
      "10,000 transactions/mo",
      "6-month history",
      "Unlimited custom rules",
      "4 AI agents (basic + geo + behavior + identity)",
      "API access",
      "Outbound webhooks",
      "Priority support (< 24h)",
    ],
    features: [
      "Everything in Starter +",
      "Multi-agent AI specialists",
      "Geographic analysis",
      "Behavioral analysis (velocity, patterns)",
      "Identity verification (email, address)",
      "Slack/Discord alerts",
      "Advanced CSV/PDF export",
      "Complex conditional rules",
      '"Shadow" mode (analyze without blocking)',
    ],
    cta: "Get started",
    popular: true,
    icon: TrendingUp,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    description: "Custom solution for large companies.",
    limits: [
      "Unlimited transactions",
      "Unlimited history",
      "Everything unlimited",
      "Custom AI agents + ML",
      "Dedicated infrastructure available",
      "24/7 support",
      "99.99% SLA",
      "Dedicated account manager",
    ],
    features: [
      "Everything in Growth +",
      "ML models trained on your data",
      "Dedicated infrastructure (if needed)",
      "Custom compliance (audit, certifications)",
      "Custom integrations with your systems",
      "Annual contract with commitment",
      "Strategic consulting included",
      "Early access to new features",
    ],
    cta: "Contact sales",
    popular: false,
    icon: Crown,
  },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-black">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-zinc-400 mb-10"
          >
            No hidden fees. Cancel anytime. Start for free.
          </motion.p>

          <div className="flex items-center justify-center gap-4 p-1.5 bg-white/5 rounded-full border border-white/10 w-fit mx-auto backdrop-blur-sm">
            <span
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                !isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400",
              )}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-indigo-500"
            />
            <span
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400",
              )}
            >
              Annual{" "}
              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <Card
                className={cn(
                  "flex flex-col h-full transition-all duration-300 bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-white/20",
                  plan.popular
                    ? "border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105 z-10"
                    : "hover:bg-zinc-900/60",
                )}
              >
                {plan.popular && (
                  <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
                )}

                <CardHeader className="pb-6 pt-8 px-8">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-white/5 border border-white/10 text-white",
                      )}
                    >
                      <plan.icon className="w-5 h-5" />
                    </div>
                    {plan.popular && (
                      <Badge
                        variant="secondary"
                        className="bg-indigo-500/20 text-indigo-300 border-indigo-500/20 text-xs px-2 py-0.5"
                      >
                        Most popular
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-sm min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 px-8 pb-6 overflow-y-auto">
                  <div className="mb-8 pb-8 border-b border-white/5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white tracking-tight">
                        {plan.price === "Custom"
                          ? "Custom"
                          : plan.price === "0"
                          ? "Free"
                          : `$${
                              isAnnual
                                ? plan.price
                                : Math.round(Number(plan.price) * 1.2)
                            }`}
                      </span>
                      {plan.price !== "Custom" && plan.price !== "0" && (
                        <span className="text-zinc-500 font-medium text-base">
                          /mo
                        </span>
                      )}
                    </div>
                    {isAnnual &&
                      plan.price !== "Custom" &&
                      plan.price !== "0" && (
                        <div className="text-xs text-zinc-500 mt-1.5 font-medium">
                          Billed annually
                        </div>
                      )}
                  </div>
                  {plan.limits && plan.limits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wide">
                        Limits
                      </h4>
                      <ul className="space-y-3">
                        {plan.limits.map((limit, i) => {
                          const isUnavailable = limit
                            .toLowerCase()
                            .includes("no ");
                          return (
                            <li key={i} className="flex items-start gap-2.5">
                              <div
                                className={cn(
                                  "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0",
                                  isUnavailable
                                    ? "bg-red-500/10 border border-red-500/20"
                                    : "bg-white/10",
                                )}
                              >
                                {isUnavailable ? (
                                  <X className="h-2.5 w-2.5 text-red-400" />
                                ) : (
                                  <Check className="h-2.5 w-2.5 text-white" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-sm leading-relaxed",
                                  isUnavailable
                                    ? "text-zinc-500 line-through"
                                    : "text-zinc-300",
                                )}
                              >
                                {limit}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="px-8 pb-8 pt-6">
                  <Button
                    className={cn(
                      "w-full h-10 rounded-lg text-sm font-semibold transition-all duration-300",
                      plan.popular
                        ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10",
                    )}
                    variant="ghost"
                    size="sm"
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
