"use client";

import { motion } from "framer-motion";
import { Check, Star, Zap, Shield, Gift, TrendingUp, Crown, X } from "lucide-react";
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
    description: "Parfait pour commencer et tester.",
    limits: [
      "100 transactions analysées/mois",
      "Historique 7 jours",
      "0 règles personnalisées",
      "1 agent IA basique",
      "Pas d'accès API",
      "Pas de webhooks",
      "Support email standard",
    ],
    features: [
      "Score de risque basique",
      "Dashboard simple",
      "Blocage automatique si score > 90",
      "Alertes email",
    ],
    cta: "Commencer gratuitement",
    popular: false,
    icon: Gift,
  },
  {
    name: "STARTER",
    price: "99",
    description: "Pour les projets en développement.",
    limits: [
      "1 000 transactions/mois",
      "Historique 30 jours",
      "3 règles personnalisées",
      "2 agents IA (basic + geo)",
      "Pas d'accès API",
      "Pas de webhooks",
      "Support email prioritaire",
    ],
    features: [
      "Tout de Free +",
      "Analyse IA avancée (GPT-4)",
      "Détection géographique (IP vs carte)",
      "Blocage automatique configurable",
      "Alertes email détaillées",
      "Export CSV basique",
    ],
    cta: "Démarrer l'essai",
    popular: false,
    icon: Zap,
  },
  {
    name: "GROWTH",
    price: "299",
    description: "Pour les entreprises en croissance.",
    limits: [
      "10 000 transactions/mois",
      "Historique 6 mois",
      "Règles personnalisées illimitées",
      "4 agents IA (basic + geo + behavior + identity)",
      "Accès API",
      "Webhooks sortants",
      "Support prioritaire (< 24h)",
    ],
    features: [
      "Tout de Starter +",
      "Multi-agents IA spécialisés",
      "Analyse géographique",
      "Analyse comportementale (vélocité, patterns)",
      "Vérification identité (email, adresse)",
      "Alertes Slack/Discord",
      "Export CSV/PDF avancé",
      "Règles conditionnelles complexes",
      "Mode \"Shadow\" (analyse sans bloquer)",
    ],
    cta: "Commencer maintenant",
    popular: true,
    icon: TrendingUp,
  },
  {
    name: "BUSINESS",
    price: "799",
    description: "Pour les plateformes à grande échelle.",
    limits: [
      "50 000 transactions/mois",
      "Historique illimité",
      "Règles illimitées",
      "Agent IA personnalisé à votre business",
      "Accès API complet",
      "Webhooks bidirectionnels",
      "Support prioritaire (< 2h)",
      "SLA 99.9%",
    ],
    features: [
      "Tout de Growth +",
      "Agent IA entraîné sur vos données",
      "Intégration dédiée (onboarding personnalisé)",
      "Appels stratégie mensuels",
      "Tableau de bord avancé avec analytics",
      "Whitelisting/Blacklisting automatique",
      "Tests A/B de règles",
      "Rapports personnalisés",
    ],
    cta: "Contacter les ventes",
    popular: false,
    icon: Shield,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    description: "Solution sur-mesure pour grandes entreprises.",
    limits: [
      "Transactions illimitées",
      "Historique illimité",
      "Tout illimité",
      "Agents IA sur-mesure + ML custom",
      "Infrastructure dédiée possible",
      "Support 24/7",
      "SLA 99.99%",
      "Account manager dédié",
    ],
    features: [
      "Tout de Business +",
      "Modèles ML entraînés spécifiquement pour vous",
      "Infrastructure dédiée (si nécessaire)",
      "Conformité sur-mesure (audit, certifications)",
      "Intégrations custom avec vos systèmes",
      "Contract annuel avec engagement",
      "Consulting stratégique inclus",
      "Accès anticipé aux nouvelles features",
    ],
    cta: "Contacter les ventes",
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
            Tarification simple et transparente
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-zinc-400 mb-10"
          >
            Aucun frais caché. Annulez à tout moment. Commencez gratuitement.
          </motion.p>

          <div className="flex items-center justify-center gap-4 p-1.5 bg-white/5 rounded-full border border-white/10 w-fit mx-auto backdrop-blur-sm">
            <span
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                !isAnnual ? "bg-zinc-800 text-white" : "text-zinc-400",
              )}
            >
              Mensuel
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
              Annuel{" "}
              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                -20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
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

                <CardHeader className="pb-4 pt-6 px-6">
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
                        Plus populaire
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-white mb-1">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-sm min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 px-6 pb-6 overflow-y-auto max-h-[600px]">
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white tracking-tight">
                        {plan.price === "Custom"
                          ? "Sur-mesure"
                          : plan.price === "0"
                            ? "Gratuit"
                            : `€${isAnnual ? plan.price : Math.round(Number(plan.price) * 1.2)}`}
                      </span>
                      {plan.price !== "Custom" && plan.price !== "0" && (
                        <span className="text-zinc-500 font-medium text-base">
                          /mois
                        </span>
                      )}
                    </div>
                    {isAnnual && plan.price !== "Custom" && plan.price !== "0" && (
                      <div className="text-xs text-zinc-500 mt-1.5 font-medium">
                        Facturé annuellement
                      </div>
                    )}
                  </div>
                  {plan.limits && plan.limits.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                        Limites
                      </h4>
                      <ul className="space-y-2.5">
                        {plan.limits.map((limit, i) => {
                          const isUnavailable = limit.toLowerCase().includes("pas d'") || limit.toLowerCase().includes("pas de");
                          return (
                            <li key={i} className="flex items-start gap-2.5">
                              <div className={cn(
                                "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0",
                                isUnavailable 
                                  ? "bg-red-500/10 border border-red-500/20" 
                                  : "bg-white/10"
                              )}>
                                {isUnavailable ? (
                                  <X className="h-2.5 w-2.5 text-red-400" />
                                ) : (
                                  <Check className="h-2.5 w-2.5 text-white" />
                                )}
                              </div>
                              <span className={cn(
                                "text-xs leading-relaxed",
                                isUnavailable ? "text-zinc-500 line-through" : "text-zinc-300"
                              )}>
                                {limit}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                        Features
                      </h4>
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <div className="mt-0.5 h-4 w-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                              <Check className="h-2.5 w-2.5 text-green-400" />
                            </div>
                            <span className="text-zinc-300 text-xs leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="px-6 pb-6 pt-0">
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