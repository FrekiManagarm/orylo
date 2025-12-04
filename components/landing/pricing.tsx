"use client";

import { motion } from "framer-motion";
import { Check, Zap, Gift, TrendingUp, X, ArrowRight } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const pricingTiers = [
  { limit: 10000, label: "10k", starter: 99, growth: 199 },
  { limit: 50000, label: "50k", starter: 199, growth: 299 },
  { limit: 100000, label: "100k", starter: 299, growth: 499 },
  { limit: 500000, label: "500k", starter: 499, growth: 899 },
  { limit: 1000000, label: "1M", starter: 899, growth: 1499 },
  { limit: 5000000, label: "5M", starter: 1499, growth: 2999 },
  { limit: 10000000, label: "10M+", starter: 2499, growth: 4999 },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [tierIndex, setTierIndex] = useState(0);

  const currentTier = pricingTiers[tierIndex];

  const paidPlans = [
    {
      name: "STARTER",
      price: currentTier.starter,
      description: "For growing projects.",
      limits: [
        `${currentTier.label} transactions/mo`,
        "30-day history",
        "3 custom rules",
        "2 AI agents (basic + geo)",
        "No API access",
        "No webhooks",
        "Priority email support",
      ],
      cta: "Start trial",
      popular: false,
      icon: Zap,
    },
    {
      name: "GROWTH",
      price: currentTier.growth,
      description: "For scaling businesses.",
      limits: [
        `${currentTier.label} transactions/mo`,
        "6-month history",
        "Unlimited custom rules",
        "4 AI agents (basic + geo + behavior + identity)",
        "API access",
        "Outbound webhooks",
        "Priority support (< 24h)",
      ],
      cta: "Get started",
      popular: true,
      icon: TrendingUp,
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-black">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-6 text-white"
          >
            Pricing based on your growth
          </motion.h2>

          {/* Slider Control */}
          <div className="max-w-lg mx-auto mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-400 text-xs">
                Estimated monthly transactions
              </span>
              <span className="bg-white text-black px-2.5 py-0.5 rounded-full text-xs font-medium">
                Up to {currentTier.label}
              </span>
            </div>
            <Slider
              defaultValue={[0]}
              max={pricingTiers.length - 1}
              step={1}
              value={[tierIndex]}
              onValueChange={(value) => setTierIndex(value[0])}
              className="mb-2 h-4"
            />
            <div className="flex justify-between text-zinc-500 text-[10px] font-medium uppercase tracking-wider">
              <span>10k</span>
              <span>10M+</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-1 bg-white/5 rounded-full border border-white/10 w-fit mx-auto backdrop-blur-sm">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                !isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400",
              )}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-indigo-500 scale-90"
            />
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-2",
                isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400",
              )}
            >
              Annual{" "}
              <span className="text-[9px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                -20%
              </span>
            </span>
          </div>
        </div>

        {/* Paid Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
          {paidPlans.map((plan, index) => (
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
                    ? "border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-[1.02] z-10"
                    : "hover:bg-zinc-900/60",
                )}
              >
                {plan.popular && (
                  <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
                )}

                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-1.5 rounded-md bg-white/5 border border-white/10 text-white">
                      <plan.icon className="w-4 h-4" />
                    </div>
                    {plan.popular && (
                      <Badge
                        variant="secondary"
                        className="bg-indigo-500/20 text-indigo-300 border-indigo-500/20 text-[10px] px-1.5 py-0.5 h-5"
                      >
                        Most popular
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-white mb-1">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs min-h-[32px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 px-6 pb-4 overflow-y-auto">
                  <div className="mb-5 pb-5 border-b border-white/5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        ${isAnnual
                          ? plan.price
                          : Math.round(Number(plan.price) * 1.2)}
                      </span>
                      <span className="text-zinc-500 font-medium text-sm">
                        /mo
                      </span>
                    </div>
                    {isAnnual && (
                      <div className="text-[10px] text-zinc-500 mt-1 font-medium">
                        Billed annually
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
                      Included
                    </h4>
                    <ul className="space-y-2">
                      {plan.limits.map((limit, i) => {
                        const isUnavailable = limit
                          .toLowerCase()
                          .includes("no ");
                        return (
                          <li key={i} className="flex items-start gap-2">
                            <div
                              className={cn(
                                "mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0",
                                isUnavailable
                                  ? "bg-red-500/10 border border-red-500/20"
                                  : "bg-white/10",
                              )}
                            >
                              {isUnavailable ? (
                                <X className="h-2 w-2 text-red-400" />
                              ) : (
                                <Check className="h-2 w-2 text-white" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-xs leading-relaxed",
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
                </CardContent>

                <CardFooter className="px-6 pb-6 pt-2">
                  <Button
                    className={cn(
                      "w-full h-9 rounded-md text-xs font-semibold transition-all duration-300",
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

        {/* Free Plan Separate Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10 text-white hidden md:block">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Just getting started?
                  </h3>
                  <p className="text-sm text-zinc-400 mb-3 max-w-md">
                    Try our Free plan with 100 transactions/mo, 7-day history,
                    and basic risk scoring. Perfect for testing.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-400">No credit card</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-400">Basic features</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Start for free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
