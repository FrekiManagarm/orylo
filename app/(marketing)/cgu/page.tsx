import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read Orylo's Terms of Service. Understand the terms and conditions for using our AI-powered fraud detection platform for Stripe.",
  alternates: {
    canonical: "/cgu",
  },
  openGraph: {
    title: "Terms of Service | Orylo",
    description:
      "Read Orylo's Terms of Service. Understand the terms and conditions for using our AI-powered fraud detection platform for Stripe.",
    url: `${baseUrl}/cgu`,
  },
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
      <Navbar />

      <main className="pt-32 pb-20 container mx-auto px-4 max-w-4xl">
        {/* Background Gradients */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-900/20 blur-[120px] opacity-30" />
        </div>

        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Terms of Service
          </h1>
          <div className="h-1 w-20 bg-indigo-500 rounded-full mb-6" />
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
              Introduction
            </h2>
            <p className="mb-4 text-zinc-400">
              Welcome to Orylo. By using our website and services, you agree to
              comply with and be bound by these terms of service. If you do not
              agree to these terms, please do not use our services.
            </p>
            <p className="text-zinc-400">
              These terms apply to all visitors, users, and others who access or
              use the Service. Accessing our services implies unreserved
              acceptance of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                2
              </span>
              Service Description
            </h2>
            <p className="text-zinc-400">
              Orylo provides an AI-powered fraud detection platform for Stripe.
              We help businesses protect their transactions and reduce
              chargebacks through advanced behavioral analysis and anomaly
              detection algorithms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                3
              </span>
              User Accounts
            </h2>
            <p className="mb-4 text-zinc-400">
              When creating an account with us, you must provide us with
              accurate, complete, and up-to-date information. Failure to do so
              constitutes a breach of the terms, which may result in immediate
              termination of your account on our service.
            </p>
            <p className="text-zinc-400">
              You are responsible for safeguarding the password that you use to
              access the service and for any activities or actions under your
              password. You agree not to disclose your password to any third
              party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                4
              </span>
              Intellectual Property
            </h2>
            <p className="text-zinc-400">
              The Service and its original content (excluding content provided
              by users), features, and functionality are and will remain the
              exclusive property of Orylo and its licensors. The Service is
              protected by copyright, trademark, and other laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                5
              </span>
              Limitation of Liability
            </h2>
            <p className="text-zinc-400">
              In no event shall Orylo, nor its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm">
                6
              </span>
              Changes
            </h2>
            <p className="text-zinc-400">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material we will try to
              provide at least 30 days notice prior to any new terms taking
              effect.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
