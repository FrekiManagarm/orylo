import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/lib/context/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// URL de base pour les métadonnées (peut être surchargée par NEXT_PUBLIC_APP_URL)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Orylo - AI-Powered Fraud Detection for Stripe",
    template: "%s | Orylo",
  },
  description:
    "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      {
        url: "/favicon.ico",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon.ico",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/favicon.ico", sizes: "32x32" },
    ],
  },
  keywords: [
    "fraud detection",
    "Stripe",
    "AI",
    "security",
    "transactions",
    "chargeback",
    "fraud prevention",
  ],
  authors: [{ name: "Orylo" }],
  creator: "Orylo",
  publisher: "Orylo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Orylo",
    title: "Orylo - AI-Powered Fraud Detection for Stripe",
    description:
      "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orylo - AI-Powered Fraud Detection for Stripe",
    description:
      "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
