"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowRight, CheckCircle2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import React from "react";

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-40 pb-20 bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Background */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              1000px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%) pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Badge
              variant="outline"
              className="px-4 py-2 rounded-full bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Beta coming soon
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-8xl font-bold tracking-tight mb-8 text-white"
          >
            Detect fraud <br />
            <span className="bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
              before it costs you
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed"
          >
            Orylo analyzes every Stripe transaction with AI. Block 80% of fraud,
            reduce chargebacks, and protect your account. 
            Setup in 5 minutes, zero code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 py-7 text-lg bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-xl shadow-white/10"
            >
              <Link href="#pricing">
                Start for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-7 text-lg bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-md transition-all duration-300"
            >
              <Link href="#features">Explore features</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-zinc-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              <span>One-click Stripe connection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              <span>Free plan available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              <span>Zero code required</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 1,
            delay: 0.6,
            type: "spring",
            stiffness: 50,
          }}
          className="mt-20 relative perspective-1000"
        >
          <div className="relative mx-auto max-w-6xl rounded-2xl border border-white/10 bg-zinc-900/50 p-2 backdrop-blur-sm shadow-2xl shadow-indigo-500/10">
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative border border-white/5">
              <div className="absolute inset-0 bg-linear-to-br from-zinc-900/50 to-black flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <span className="text-zinc-500 font-medium">
                    Orylo Dashboard
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect behind dashboard */}
          <div className="absolute -inset-4 bg-linear-to-r from-indigo-500 to-purple-500 opacity-20 blur-3xl -z-10 rounded-[3rem]" />
        </motion.div>
      </div>
    </section>
  );
}