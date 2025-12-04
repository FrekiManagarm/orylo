import { AboutContent } from "@/components/marketing/about-content";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Orylo's mission to secure the digital economy. We use AI-powered technology to help businesses grow without fearing fraud.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | Orylo",
    description:
      "Learn about Orylo's mission to secure the digital economy. We use AI-powered technology to help businesses grow without fearing fraud.",
    url: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
