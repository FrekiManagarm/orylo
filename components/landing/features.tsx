"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Code2,
  Globe2,
  Layers,
  ShieldCheck,
  Zap
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Global Payments",
    description: "Accept payments from 135+ countries. Local currency support included.",
    icon: Globe2,
    className: "md:col-span-2",
  },
  {
    title: "Real-time Analytics",
    description: "Track revenue, churn, and growth instantly.",
    icon: BarChart3,
    className: "md:col-span-1",
  },
  {
    title: "Developer First",
    description: "Type-safe SDKs and great docs.",
    icon: Code2,
    className: "md:col-span-1",
  },
  {
    title: "Enterprise Security",
    description: "SOC2 Type II, GDPR, and bank-grade encryption.",
    icon: ShieldCheck,
    className: "md:col-span-2",
  },
  {
    title: "Instant Payouts",
    description: "Get paid faster to your bank account.",
    icon: Zap,
    className: "md:col-span-1",
  },
  {
    title: "Custom UI",
    description: "Pre-built components for your flow.",
    icon: Layers,
    className: "md:col-span-2",
  }
];

export default function Features() {
  return (
    <section id="features" className="py-32 relative overflow-hidden bg-black">
      {/* Ambient Background - Subtle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm"
          >
            <span className="text-sm font-medium text-zinc-400">Features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold mb-6 text-white tracking-tight"
          >
            Powerful features for <br />
            <span className="text-zinc-500">modern marketplaces</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
          >
            Everything you need to build, scale, and manage your platform. Designed for simplicity and performance.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn("group h-full", feature.className)}
            >
              <Card className="h-full bg-zinc-900/20 border-white/5 backdrop-blur-md hover:bg-zinc-900/40 hover:border-white/10 transition-all duration-500 overflow-hidden rounded-3xl">
                <CardHeader className="p-8 h-full flex flex-col justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    <feature.icon className="h-5 w-5 text-zinc-300 group-hover:text-white transition-colors" />
                  </div>

                  <div>
                    <CardTitle className="text-xl font-medium text-white mb-3">
                      {feature.title}
                    </CardTitle>
                    <p className="text-zinc-400 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}