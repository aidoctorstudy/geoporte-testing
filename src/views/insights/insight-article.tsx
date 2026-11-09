import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { articles } from "@/data/mocks/insights";
import { contact } from "@/lib/company";

export function generateArticleStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateArticleMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  return buildMetadata({
    title: article.metaTitle,
    description: article.metaDescription,
    url: `/insights/${slug}`,
  });
}

export async function InsightArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <main>
      <article>
        {/* ── Header ── */}
        <header className="border-line border-b py-24 md:py-36">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <Inview
              tag="div"
              mode="once"
              from={{ opacity: 0, y: 12 }}
              to={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-4"
            >
              <span className="text-label inline-flex rounded-full border border-current px-3 py-0.5 text-xs tracking-[0.1em] uppercase">
                {article.category}
              </span>
              <span className="text-foreground-muted text-xs">{article.author}</span>
            </Inview>
            <Inview
              tag="h1"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={80}
              className="font-heading text-heading text-3xl font-medium leading-[1.1] md:text-5xl"
            >
              {article.title}
            </Inview>
            <Inview
              tag="p"
              mode="once"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={150}
              className="text-foreground-muted mt-6 text-base leading-relaxed md:text-lg"
            >
              {article.excerpt}
            </Inview>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
          <div className="flex flex-col gap-6">
            {article.body.map((para, i) => (
              <Inview
                key={i}
                tag="p"
                mode="once"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                delayIn={i * 40}
                className="text-foreground-muted text-base leading-relaxed md:text-lg"
              >
                {para}
              </Inview>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <footer className="border-line border-t py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <Inview
              tag="p"
              mode="once"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              className="text-foreground-muted text-sm"
            >
              Questions about this topic or a project in similar ground?{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-foreground hover:text-accent underline underline-offset-2 transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                Get in touch
              </a>
              .
            </Inview>
            <Inview
              tag="div"
              mode="once"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={80}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/contact"
                className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                Discuss your project
                <span aria-hidden="true">&#8594;</span>
              </Link>
              <Link
                href="/insights"
                className="border-line text-foreground-muted hover:text-foreground inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                All insights
              </Link>
            </Inview>
          </div>
        </footer>
      </article>
    </main>
  );
}
