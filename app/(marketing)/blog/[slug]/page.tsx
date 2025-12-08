import Link from "next/link";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { notFound } from "next/navigation";

import BlogCta from "@/components/landing/blog-cta";
import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";
import { blog } from "@/lib/blog/source";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);
  if (!page) notFound();
  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();
  const Mdx = page.data.body;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-15%] h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute left-8 top-1/2 h-64 w-64 rounded-full bg-indigo-500/15 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_45%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 py-18 md:px-8 md:py-28 space-y-14">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-8 backdrop-blur-xl shadow-xl">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-indigo-200 transition hover:text-indigo-100"
          >
            ← Retour au blog
          </Link>
          <div className="mt-6 space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200">
              {new Date(page.data.date).toLocaleDateString("fr-FR", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {page.data.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {page.data.description}
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-zinc-300">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                  Auteur
                </p>
                <p className="font-medium text-white">{page.data.author}</p>
              </div>
            </div>
          </div>
        </div>

        <article className="prose prose-invert prose-headings:text-white prose-a:text-indigo-300 prose-strong:text-white prose-blockquote:border-l-indigo-400/60 min-w-0 space-y-6">
          <InlineTOC items={page.data.toc} />
          <Mdx components={defaultMdxComponents} />
        </article>
      </main>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-24 md:px-8 md:pb-32">
        <BlogCta />
      </div>
      <Footer />
    </div>
  );
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}