"use client";

import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";
import { motion } from "framer-motion";
import { Shield, Users, Zap } from "lucide-react";

const stats = [
  { label: "Transactions Analyzed", value: "1M+" },
  { label: "Accuracy Rate", value: "99.9%" },
  { label: "Protected Businesses", value: "500+" },
  { label: "Countries Covered", value: "30+" },
];

const values = [
  {
    icon: Shield,
    title: "Total Transparency",
    description:
      "Every decision explained in plain language. No black boxes, no opaque scores.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "5-minute OAuth connection. Enterprise protection without enterprise complexity.",
  },
  {
    icon: Users,
    title: "Built for SMBs",
    description:
      "Starting at €99/month with AI-powered fraud detection. No €5K minimums.",
  },
];

export function AboutContent() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
      <Navbar />

      <main className="pt-32 pb-20">
        {/* Background Gradients */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 blur-[120px] opacity-30" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 blur-[120px] opacity-30" />
        </div>

        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-24">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
            >
              Fraud Detection That Makes Sense
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto"
            >
              We believe Stripe merchants deserve enterprise-grade fraud protection
              without enterprise prices or complexity.
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 border-y border-white/10 py-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mission Section */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Mission
              </h2>
              <div className="space-y-6 text-zinc-400 text-lg">
                <p>
                  <strong className="text-white">For Stripe merchants processing €10K-500K/month</strong> who
                  lose 1-3% of revenue to fraud and chargebacks but can&apos;t justify
                  €2K+/month enterprise solutions.
                </p>
                <p>
                  <strong className="text-white">Fraud Shield by Orylo</strong> blocks fraudulent transactions
                  in real-time while explaining every decision in plain language —
                  not opaque probability scores.
                </p>
                <p>
                  <strong className="text-white">Unlike Stripe Radar or enterprise solutions,</strong> we deploy
                  in 5 minutes via OAuth and use GPT-4 multi-agent analysis to provide
                  transparent, auditable fraud decisions at SMB-friendly pricing.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10"
            >
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-purple-500/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-32 h-32 text-indigo-500/20" />
              </div>
              {/* Decorative elements */}
              <div className="absolute top-10 right-10 p-4 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">System Active</span>
                </div>
                <div className="text-xs text-zinc-400">
                  Real-time protection
                </div>
              </div>
              <div className="absolute bottom-10 left-10 p-4 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">0.01s</div>
                <div className="text-xs text-zinc-400">Response Time</div>
              </div>
            </motion.div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="p-8 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-indigo-500/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400">
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">
                    {value.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

