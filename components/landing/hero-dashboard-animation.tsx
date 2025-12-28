"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, CreditCard, Activity, Search, Ban, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TransactionDetail {
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}

interface Scenario {
  id: string;
  email: string;
  amount: string;
  risk: number;
  status: "block" | "allow";
  type: "card-testing" | "legitimate";
  details: TransactionDetail[];
  action?: string;
}

const scenarios: Scenario[] = [
  {
    id: "sc_1",
    email: "card_tester@temp.xyz",
    amount: "€89.00",
    risk: 92,
    status: "block",
    type: "card-testing",
    action: "Auto-refunded",
    details: [
      {
        icon: CreditCard,
        label: "Multiple cards detected",
        value: "4 different cards",
        subValue: "Same session, 3 min window",
        color: "text-rose-400"
      },
      {
        icon: Ban,
        label: "Pattern detected",
        value: "Fail → Fail → Fail → Success",
        subValue: "Classic card testing",
        color: "text-rose-400"
      },
      {
        icon: RefreshCw,
        label: "Action taken",
        value: "Auto-refund + Blacklist",
        subValue: "IP added to watchlist",
        color: "text-amber-400"
      }
    ]
  },
  {
    id: "sc_2",
    email: "john.doe@gmail.com",
    amount: "€42.50",
    risk: 8,
    status: "allow",
    type: "legitimate",
    details: [
      {
        icon: CheckCircle,
        label: "No suspicious activity",
        value: "Single card, normal pattern",
        color: "text-green-400"
      }
    ]
  },
  {
    id: "sc_3",
    email: "fraud_attempt@proxy.io",
    amount: "€199.00",
    risk: 78,
    status: "block",
    type: "card-testing",
    action: "Auto-refunded",
    details: [
      {
        icon: CreditCard,
        label: "Multiple cards detected",
        value: "3 different cards",
        subValue: "5 attempts in 2 minutes",
        color: "text-rose-400"
      },
      {
        icon: Activity,
        label: "Rapid attempts",
        value: "5 attempts in 2 min",
        subValue: "Velocity check failed",
        color: "text-amber-400"
      }
    ]
  },
  {
    id: "sc_4",
    email: "alice@company.co",
    amount: "€129.00",
    risk: 12,
    status: "allow",
    type: "legitimate",
    details: [
      {
        icon: CheckCircle,
        label: "Normal transaction",
        value: "Single attempt, single card",
        color: "text-green-400"
      }
    ]
  },
];

const initialHistory = [
  { id: "tx_1", email: "alice@example.com", amount: "€42.00", status: "allow", time: "2 min ago", risk: 8 },
  { id: "tx_2", email: "bob@company.co", amount: "€129.50", status: "allow", time: "5 min ago", risk: 6 },
  { id: "tx_3", email: "sarah.j@gmail.com", amount: "€24.90", status: "allow", time: "12 min ago", risk: 4 },
];

export function HeroDashboardAnimation() {
  const [step, setStep] = useState(0);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [history, setHistory] = useState(initialHistory);

  const currentScenario = scenarios[scenarioIndex];

  useEffect(() => {
    let mounted = true;

    const runSequence = async () => {
      while (mounted) {
        setStep(0);
        await new Promise(r => setTimeout(r, 1000));

        if (!mounted) break;
        setStep(1);
        await new Promise(r => setTimeout(r, 1500));

        if (!mounted) break;
        setStep(2);

        const waitTime = currentScenario.status === "block" ? 4000 : 2000;
        await new Promise(r => setTimeout(r, waitTime));

        if (!mounted) break;
        setHistory(prev => [
          {
            id: `hist_${Date.now()}`,
            email: scenarios[scenarioIndex].email,
            amount: scenarios[scenarioIndex].amount,
            status: scenarios[scenarioIndex].status,
            time: "Just now",
            risk: scenarios[scenarioIndex].risk,
          },
          ...prev.slice(0, 4)
        ]);

        setScenarioIndex(prev => (prev + 1) % scenarios.length);
      }
    };

    runSequence();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIndex]);

  return (
    <DashboardContent
      step={step}
      scenario={currentScenario}
      history={history}
    />
  );
}

function DashboardContent({ step, scenario, history }: { step: number, scenario: Scenario, history: any[] }) {
  return (
    <div className="w-full h-full bg-zinc-950 rounded-xl overflow-hidden flex flex-col border border-white/5 relative font-sans select-none">
      {/* Fake Header */}
      <div className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 gap-4 bg-zinc-900/50 backdrop-blur-sm z-30 relative">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <div className="h-4 w-px bg-white/10 mx-2" />
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-black/20 px-3 py-1.5 rounded-md border border-white/5 w-64">
          <Search className="w-3 h-3" />
          <span>Search transactions...</span>
        </div>
      </div>

      <div className="flex-1 p-6 relative flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Live Feed</h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-500 font-medium">Monitoring</span>
          </div>
        </div>

        <div className="flex-1 relative flex flex-col">
          <div className="relative z-20 min-h-[180px] mb-4">
            <AnimatePresence mode="wait">
              {step >= 1 ? (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="absolute inset-x-0 top-0"
                >
                  <div className={cn(
                    "rounded-lg p-4 border transition-colors duration-500 flex items-center justify-between relative bg-zinc-900/90 backdrop-blur-md z-30",
                    step >= 2
                      ? (scenario.status === "block" ? "bg-red-500/10 border-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]" : "bg-green-500/10 border-green-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]")
                      : "bg-zinc-900/80 border-white/10"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500",
                        step >= 2
                          ? (scenario.status === "block" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")
                          : "bg-zinc-800 text-zinc-400"
                      )}>
                        {step >= 2
                          ? (scenario.status === "block" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />)
                          : <Activity className="w-5 h-5 animate-pulse" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{scenario.email}</span>
                          {step >= 2 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={cn(
                                "text-[10px] font-bold text-white px-1.5 py-0.5 rounded-sm",
                                scenario.status === "block" ? "bg-red-500" : "bg-green-500"
                              )}
                            >
                              {scenario.status === "block" ? "BLOCKED" : "ALLOWED"}
                            </motion.span>
                          )}
                          {step >= 2 && scenario.type === "card-testing" && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-sm bg-rose-500"
                            >
                              CARD TESTING
                            </motion.span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                          <span>{scenario.amount}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span>Just now</span>
                          {step >= 2 && scenario.action && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-zinc-700" />
                              <span className="text-amber-400">{scenario.action}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {step === 1 && (
                      <div className="text-xs text-indigo-400 font-medium animate-pulse flex items-center gap-1.5">
                        <Activity className="w-3 h-3" />
                        Analyzing...
                      </div>
                    )}

                    {step >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-right"
                      >
                        <div className={cn(
                          "text-sm font-bold",
                          scenario.status === "block" ? "text-red-400" : "text-green-400"
                        )}>{scenario.risk}/100</div>
                        <div className={cn(
                          "text-[10px] font-medium",
                          scenario.status === "block" ? "text-red-400/80" : "text-green-400/80"
                        )}>Suspicion Score</div>
                      </motion.div>
                    )}
                  </div>

                  {/* Visual Explanations - USP */}
                  <AnimatePresence>
                    {step >= 2 && scenario.details.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-2 p-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl grid grid-cols-2 gap-2 relative z-20"
                      >
                        {scenario.details.map((detail, idx) => (
                          <div key={idx} className={cn(
                            "flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/5",
                            idx === 2 ? "col-span-2" : ""
                          )}>
                            <detail.icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", detail.color)} />
                            <div className="min-w-0">
                              <div className="text-[10px] text-zinc-400 leading-none mb-1">{detail.label}</div>
                              <div className="text-xs font-medium text-white truncate">{detail.value}</div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600 text-sm animate-pulse">
                  Waiting for transaction...
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)">
              <div className="space-y-2">
                {history.map((tx) => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    className="rounded-lg p-3 bg-white/5 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.status === "block" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                      )}>
                        {tx.status === "block" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-300">{tx.email}</div>
                        <div className="text-xs text-zinc-500">{tx.amount} • {tx.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-xs font-medium",
                        tx.status === "block" ? "text-red-500" : "text-green-500"
                      )}>{tx.risk}/100</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/5 to-transparent h-[10px] w-full animate-scan pointer-events-none opacity-20" />
    </div>
  );
}
