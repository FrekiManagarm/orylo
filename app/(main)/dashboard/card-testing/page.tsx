import { Metadata } from "next";
import { Suspense } from "react";
import CardTestingClient from "./card-testing-client";
import {
  getCardTestingTrackers,
  getCardTestingStats,
} from "@/lib/actions/card-testing";

export const metadata: Metadata = {
  title: "Card Testing Detection | Orylo",
  description: "Monitor and block card testing fraud attempts.",
};

export const dynamic = "force-dynamic";

const CardTestingPage = async () => {
  const [trackers, stats] = await Promise.all([
    getCardTestingTrackers({ limit: 20 }),
    getCardTestingStats(),
  ]);

  return (
    <Suspense fallback={<CardTestingLoading />}>
      <CardTestingClient initialTrackers={trackers} stats={stats} />
    </Suspense>
  );
};

function CardTestingLoading() {
  return (
    <div className="min-h-screen space-y-8">
      <div className="flex flex-col gap-4">
        <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-zinc-800/50 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-900/50 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-900/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default CardTestingPage;

