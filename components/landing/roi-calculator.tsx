"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator, Euro, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

export default function RoiCalculator() {
  const [volume, setVolume] = useState([50000]);
  const [fraudRate, setFraudRate] = useState([2.0]);
  const [avgOrder, setAvgOrder] = useState([50]);

  const [savings, setSavings] = useState(0);
  const [fees, setFees] = useState(0);
  const [totalLoss, setTotalLoss] = useState(0);

  useEffect(() => {
    const monthlyVolume = volume[0];
    const rate = fraudRate[0] / 100;
    const orderValue = avgOrder[0];

    // Perte directe (marchandise/revenu perdu)
    const directLoss = monthlyVolume * rate;

    // Frais Stripe (environ 15€ par contestation + frais de dossier)
    // Nombre de fraudes estimé
    const fraudCount = directLoss / orderValue;
    const stripeDisputeFees = fraudCount * 15;

    const monthlyTotalLoss = directLoss + stripeDisputeFees;

    // Orylo bloque ~95% de la fraude
    const estimatedSavings = monthlyTotalLoss * 0.95;

    setTotalLoss(monthlyTotalLoss);
    setFees(stripeDisputeFees);
    setSavings(estimatedSavings);
  }, [volume, fraudRate, avgOrder]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[128px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] -translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-indigo-500/20 bg-indigo-500/10"
          >
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-400">
              Savings Simulator
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight"
          >
            How much is fraud <br />
            <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              really costing you?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg"
          >
            Fraud isn't just about lost merchandise. Calculate your true losses (including bank fees) and discover what you could save.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* Inputs Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <Card className="h-full p-8 rounded-3xl border-white/10 bg-zinc-900/50 backdrop-blur-xl">
              <div className="space-y-10">

                {/* Volume Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-zinc-200 text-lg font-medium">Monthly Volume (€)</Label>
                    <div className="relative w-32">
                      <Input
                        type="number"
                        value={volume[0]}
                        onChange={(e) => setVolume([Number(e.target.value)])}
                        className="text-right bg-black/40 border-white/10 text-white font-mono"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">€</span>
                    </div>
                  </div>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={1000000}
                    step={1000}
                    className="py-4"
                  />
                  <p className="text-sm text-zinc-500">Total transaction volume processed per month</p>
                </div>

                {/* Fraud Rate Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-zinc-200 text-lg font-medium">Fraud/Chargeback Rate (%)</Label>
                    <div className="relative w-32">
                      <Input
                        type="number"
                        value={fraudRate[0]}
                        onChange={(e) => setFraudRate([Number(e.target.value)])}
                        step={0.1}
                        className="text-right bg-black/40 border-white/10 text-white font-mono"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                    </div>
                  </div>
                  <Slider
                    value={fraudRate}
                    onValueChange={setFraudRate}
                    max={10}
                    step={0.1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider font-medium">
                    <span>Low Risk (0-1%)</span>
                    <span>High Risk ({'>'}2%)</span>
                  </div>
                </div>

                {/* Avg Order Value */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-zinc-200 text-lg font-medium">Average Order Value (€)</Label>
                    <div className="relative w-32">
                      <Input
                        type="number"
                        value={avgOrder[0]}
                        onChange={(e) => setAvgOrder([Number(e.target.value)])}
                        className="text-right bg-black/40 border-white/10 text-white font-mono"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">€</span>
                    </div>
                  </div>
                  <Slider
                    value={avgOrder}
                    onValueChange={setAvgOrder}
                    max={500}
                    step={5}
                    className="py-4"
                  />
                </div>

              </div>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="h-full flex flex-col gap-4">
              {/* Loss Card */}
              <div className="rounded-3xl border border-red-500/10 bg-red-500/5 backdrop-blur-xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium text-sm">Estimated current losses / month</span>
                  </div>
                  <div className="text-3xl font-mono text-white mb-2">
                    {formatCurrency(totalLoss)}
                  </div>
                  <div className="text-sm text-red-300/60">
                    Including {formatCurrency(fees)} in bank fees (Stripe fees)
                  </div>
                </div>
              </div>

              {/* Savings Card - Highlighted */}
              <div className="flex-1 rounded-3xl border border-indigo-500/30 bg-zinc-900/80 backdrop-blur-xl p-8 relative overflow-hidden flex flex-col justify-center">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-transparent" />

                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6">
                    <TrendingUp className="w-6 h-6" />
                  </div>

                  <h3 className="text-zinc-400 font-medium mb-4">Potential savings with Orylo</h3>
                  <div className="text-5xl md:text-6xl font-black text-white tracking-tight mb-2">
                    {formatCurrency(savings)}
                  </div>
                  <p className="text-indigo-300 text-sm font-medium bg-indigo-500/10 inline-block px-3 py-1 rounded-full border border-indigo-500/20">
                    per month
                  </p>

                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="text-zinc-500 text-sm mb-4">
                      Starting at just €99/month
                    </div>
                    <a href="#pricing" className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
                      Start now
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
