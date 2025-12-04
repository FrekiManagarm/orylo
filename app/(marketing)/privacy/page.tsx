import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read Orylo's Privacy Policy. Learn how we collect, use, and protect your personal data and transaction information.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Orylo",
    description:
      "Read Orylo's Privacy Policy. Learn how we collect, use, and protect your personal data and transaction information.",
    url: `${baseUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
      <Navbar />

      <main className="pt-32 pb-20 container mx-auto px-4 max-w-4xl">
        {/* Background Gradients */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-900/20 blur-[120px] opacity-30" />
        </div>

        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Privacy Policy
          </h1>
          <div className="h-1 w-20 bg-purple-500 rounded-full mb-6" />
          <p className="text-zinc-400 text-lg">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
        </div>

        <div className="space-y-12 text-zinc-300 leading-relaxed text-lg">
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                1
              </span>
              Data Collection
            </h2>
            <p className="mb-4 text-zinc-400">
              We collect different types of information for various purposes to
              provide and improve our Service to you.
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
              <li>Personal Data (email, first name, last name)</li>
              <li>Usage Data and Cookies</li>
              <li>Transaction Data for fraud analysis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                2
              </span>
              Data Usage
            </h2>
            <p className="text-zinc-400 mb-4">
              Orylo uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>
                To gather analysis or valuable information so that we can
                improve our Service
              </li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                3
              </span>
              Data Retention
            </h2>
            <p className="text-zinc-400">
              Orylo will retain your Personal Data only for as long as is
              necessary for the purposes set out in this Privacy Policy. We will
              retain and use your Personal Data to the extent necessary to
              comply with our legal obligations, resolve disputes, and enforce
              our legal agreements and policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                4
              </span>
              Data Security
            </h2>
            <p className="text-zinc-400">
              The security of your data is important to us, but remember that no
              method of transmission over the Internet, or method of electronic
              storage is 100% secure. While we strive to use commercially
              acceptable means to protect your Personal Data, we cannot
              guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                5
              </span>
              Your Rights
            </h2>
            <p className="text-zinc-400">
              Orylo aims to take reasonable steps to allow you to correct,
              amend, delete, or limit the use of your Personal Data. If you wish
              to be informed what Personal Data we hold about you and if you
              want it to be removed from our systems, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                6
              </span>
              Contact Us
            </h2>
            <p className="text-zinc-400">
              If you have any questions about this Privacy Policy, please
              contact us by email: privacy@orylo.com
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
