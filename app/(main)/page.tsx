import Cta from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";
import Pricing from "@/components/landing/pricing";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "Fraud Shield by Orylo - Stop Fraud. Understand Why.",
  description:
    "AI fraud detection that explains every decision. Enterprise protection for Stripe merchants in 5 minutes, not 5 months. From €99/month.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fraud Shield by Orylo - Stop Fraud. Understand Why.",
    description:
      "AI fraud detection that explains every decision. Enterprise protection for Stripe merchants in 5 minutes, not 5 months. From €99/month.",
    url: baseUrl,
  },
  twitter: {
    title: "Fraud Shield by Orylo - Stop Fraud. Understand Why.",
    description:
      "AI fraud detection that explains every decision. Enterprise protection for Stripe merchants in 5 minutes, not 5 months. From €99/month.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main>
        <Hero />
        <Features />
        <Pricing />
        <Cta />
      </main>

      <Footer />
    </div>
  );
}
