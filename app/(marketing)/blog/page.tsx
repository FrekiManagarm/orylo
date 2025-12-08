import Link from "next/link";

import BlogCta from "@/components/landing/blog-cta";
import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";
import { blog } from "@/lib/blog/source";

export default function Home() {
  const posts = blog.getPages();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 py-20 md:px-8 md:py-28 space-y-14">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Blog
          </p>
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Insights to fight fraud with confidence
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Analyses, retours d&apos;expérience et meilleures pratiques pour
            protéger vos paiements Stripe et comprendre chaque décision.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/10 hover:bg-white/10"
            >
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.18em] text-indigo-200">
                  {new Date(post.data.date).toLocaleDateString("fr-FR", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <h2 className="text-xl font-semibold text-white">
                  {post.data.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {post.data.description}
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-indigo-200">
                Lire l&apos;article
                <span className="ml-2 transition duration-200 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-24 md:px-8 md:pb-32">
        <BlogCta />
      </div>
      <Footer />
    </div>
  );
}