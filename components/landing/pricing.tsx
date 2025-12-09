"use client";

import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Gift,
  TrendingUp,
  X,
  ArrowRight,
} from "lucide-react";
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

// Prix par transaction dégressifs (en euros)
// Plus le volume augmente, plus le prix par transaction diminue
// Compétitif avec Stripe Radar (€0.05/tx) mais avec plus de valeur
// Ratio Starter/Growth maintenu à ~2x pour cohérence
const pricePerTransaction = {
  starter: {
    5000: 0.0198,   // €0.0198/tx = €99/mois pour 5k
    10000: 0.014,   // €0.014/tx = €140/mois pour 10k (-29% vs 5k)
    50000: 0.008,   // €0.008/tx = €400/mois pour 50k (-60% vs 5k)
    100000: 0.006,  // €0.006/tx = €600/mois pour 100k (-70% vs 5k)
    500000: 0.004,  // €0.004/tx = €2000/mois pour 500k (-80% vs 5k)
    1000000: 0.003, // €0.003/tx = €3000/mois pour 1M+ (-85% vs 5k)
  },
  growth: {
    5000: 0.0398,   // €0.0398/tx = €199/mois pour 5k
    10000: 0.028,   // €0.028/tx = €280/mois pour 10k (-30% vs 5k)
    50000: 0.016,   // €0.016/tx = €800/mois pour 50k (-60% vs 5k)
    100000: 0.012,  // €0.012/tx = €1200/mois pour 100k (-70% vs 5k)
    500000: 0.008,  // €0.008/tx = €4000/mois pour 500k (-80% vs 5k)
    1000000: 0.006, // €0.006/tx = €6000/mois pour 1M+ (-85% vs 5k)
  },
};

const pricingTiers = [
  { limit: 5000, label: "5k" },
  { limit: 10000, label: "10k" },
  { limit: 50000, label: "50k" },
  { limit: 100000, label: "100k" },
  { limit: 500000, label: "500k" },
  { limit: 1000000, label: "1M+" },
].map((tier) => ({
  ...tier,
  starter: Math.round(tier.limit * pricePerTransaction.starter[tier.limit as keyof typeof pricePerTransaction.starter]),
  growth: Math.round(tier.limit * pricePerTransaction.growth[tier.limit as keyof typeof pricePerTransaction.growth]),
}));

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [tierIndex, setTierIndex] = useState(0);

  const currentTier = pricingTiers[tierIndex];

  const getPricePerTransaction = (planType: "starter" | "growth") => {
    return pricePerTransaction[planType][currentTier.limit as keyof typeof pricePerTransaction.starter];
  };

  // Détermine le "Best Value" selon le volume
  // Pour les petits volumes (< 50k), Starter offre le meilleur rapport qualité/prix
  // Pour les gros volumes (>= 50k), Growth devient plus intéressant avec ses fonctionnalités avancées
  const getBestValuePlan = () => {
    return currentTier.limit >= 50000 ? "growth" : "starter";
  };

  const bestValuePlan = getBestValuePlan();

  const paidPlans = [
    {
      name: "STARTER",
      price: currentTier.starter,
      pricePerTx: getPricePerTransaction("starter"),
      description: "For growing projects.",
      limits: [
        `${currentTier.label} transactions/mo`,
        "30-day history",
        "3 custom rules",
        "Basic AI agents (basic + geo)",
        "No API access",
        "No webhooks",
        "Priority email support",
      ],
      cta: "Start trial",
      popular: false,
      icon: Zap,
      planType: "starter" as const,
    },
    {
      name: "GROWTH",
      price: currentTier.growth,
      pricePerTx: getPricePerTransaction("growth"),
      description: "For scaling businesses with advanced AI.",
      limits: [
        `${currentTier.label} transactions/mo`,
        "6-month history",
        "Unlimited custom rules",
        "Advanced AI agents (behavior + identity analysis)",
        "API access",
        "Outbound webhooks",
        "Priority support (< 24h)",
      ],
      cta: "Get started",
      popular: true,
      icon: TrendingUp,
      planType: "growth" as const,
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
              <span>5k</span>
              <span>1M+</span>
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
                -33%
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
                    <div className="flex flex-col items-end gap-1.5">
                      {plan.planType === bestValuePlan && (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-300 border-green-500/20 text-[10px] px-1.5 py-0.5 h-5"
                        >
                          Best Value
                        </Badge>
                      )}
                      {plan.popular && (
                        <Badge
                          variant="secondary"
                          className="bg-indigo-500/20 text-indigo-300 border-indigo-500/20 text-[10px] px-1.5 py-0.5 h-5"
                        >
                          Most popular
                        </Badge>
                      )}
                    </div>
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
                        €{isAnnual
                          ? plan.price
                          : Math.round(Number(plan.price) / 0.67)}
                      </span>
                      <span className="text-zinc-500 font-medium text-sm">
                        /mo
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                      €{(isAnnual
                        ? plan.pricePerTx
                        : plan.pricePerTx / 0.67).toFixed(4)} per transaction
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
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/10 text-white hidden md:block">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-bold text-white">
                    New to Fraud Detection?
                  </h3>
                  <p className="text-sm text-zinc-400 mb-3 max-w-md">
                    Start FREE with 1,000 transactions/month.
                    <br />
                    No credit card. No commitment. Just protection.
                  </p>
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
