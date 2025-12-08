import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BlogCta() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-10 shadow-xl backdrop-blur-xl md:p-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-purple-500/20 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
            Orylo
          </p>
          <h3 className="text-3xl font-bold text-white md:text-4xl">
            Protect your Stripe payments today
          </h3>
          <p className="max-w-2xl text-base text-zinc-400 md:text-lg">
            Ship explainable fraud detection in minutes: every decision, its
            context, and clear recommendations for each transaction.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="rounded-full px-7 py-6 text-base bg-white text-black hover:bg-white/90"
          >
            <Link href="/signup">Try Orylo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
