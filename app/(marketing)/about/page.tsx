import { AboutContent } from "@/components/marketing/about-content";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "About Us | Fraud Shield by Orylo",
  description:
    "Enterprise fraud protection for Stripe merchants without enterprise prices. Transparent AI decisions, 5-minute setup, from €99/month.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | Fraud Shield by Orylo",
    description:
      "Enterprise fraud protection for Stripe merchants without enterprise prices. Transparent AI decisions, 5-minute setup, from €99/month.",
    url: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
