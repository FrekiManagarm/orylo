import { ContactContent } from "@/components/marketing/contact-content";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Orylo. Have questions about our fraud detection solution? Need a custom demo? Our team is here to help.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Orylo",
    description:
      "Get in touch with Orylo. Have questions about our fraud detection solution? Need a custom demo? Our team is here to help.",
    url: `${baseUrl}/contact`,
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
