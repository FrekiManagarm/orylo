import Cta from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";
import Pricing from "@/components/landing/pricing";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "Orylo - AI-Powered Fraud Detection for Stripe",
  description:
    "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Orylo - AI-Powered Fraud Detection for Stripe",
    description:
      "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
    url: baseUrl,
  },
  twitter: {
    title: "Orylo - AI-Powered Fraud Detection for Stripe",
    description:
      "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
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
