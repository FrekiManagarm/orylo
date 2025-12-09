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
  manifest: "/site.webmanifest",
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-icon-precomposed.png",
      },
    ],
  },
  other: {
    "msapplication-TileColor": "#6366f1",
    "msapplication-TileImage": "/ms-icon-144x144.png",
    "msapplication-config": "/browserconfig.xml",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Orylo",
    title: "Orylo - AI-Powered Fraud Detection for Stripe",
    description:
      "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
    images: [
      {
        url: `${baseUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "Orylo - Stop fraud. Understand why.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orylo - AI-Powered Fraud Detection for Stripe",
    description:
      "Protect your Stripe transactions with AI. Orylo analyzes behaviors in real-time to detect fraud before it becomes a problem.",
    images: [`${baseUrl}/api/og`],
    creator: "@orylo",
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
  verification: {
    google: "votre-code-verification-google", // À ajouter depuis Google Search Console
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
