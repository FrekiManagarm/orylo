import Cta from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";
import Pricing from "@/components/landing/pricing";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orylo",
  description: "Orylo is a platform for creating and managing your business.",
}

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
