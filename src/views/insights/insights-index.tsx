import type { Metadata } from "next";
import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "@/components/common/SectionHeading";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { articles, publications } from "@/data/mocks/insights";
import { contact } from "@/lib/company";

export function generateInsightsMetadata(): Metadata {
  return buildMetadata({
    title: "Technical Insights on Gulf Ground Engineering | Geoporte Middle East",
    description:
      "Short technical notes from our engineers on the ground conditions and design questions that come up most often in the Gulf, plus our published papers.",
    url: "/insights",
  });
}

export function InsightsIndexView() {
  return (
    <main>
      {/* ── Hero ── */}
      <section
        aria-labelledby="insights-heading"
        className="border-line border-b py-24 md:py-36"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionHeading
            id="insights-heading"
            tag="h1"
            eyebrow="Technical insights"
            heading="Ground knowledge, written down"
            headingClassName="font-heading text-heading text-4xl font-medium leading-[1.1] md:text-6xl max-w-3xl"
          />
          <Inview
            tag="p"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={100}
            className="text-foreground-muted mt-8 max-w-2xl text-base leading-relaxed md:text-lg"
          >
            Short technical notes from our engineers on the ground conditions and design questions
            that come up most often in the Gulf, plus our published papers.
          </Inview>
        </div>
      </section>

      {/* ── Articles ── */}
      <section
        aria-labelledby="articles-heading"
        className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
      >
        <SectionHeading
          id="articles-heading"
          eyebrow="Technical notes"
          heading="Latest articles"
        />
        <ul className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <Inview
              key={article.slug}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={i * 80}
            >
              <Link
                href={`/insights/${article.slug}`}
                className="border-line bg-surface hover:border-accent group flex h-full flex-col gap-4 rounded-2xl border p-6 transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                <span className="text-label inline-flex self-start rounded-full border border-current px-3 py-0.5 text-xs tracking-[0.1em] uppercase">
                  {article.category}
                </span>
                <h2 className="text-heading text-base font-semibold leading-snug group-hover:text-accent transition-colors duration-[var(--duration-fast)] ease-entrance">
                  {article.title}
                </h2>
                <p className="text-foreground-muted flex-1 text-sm leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-foreground-muted text-xs">{article.author}</span>
                  <span className="text-label text-xs tracking-[0.1em] uppercase">
                    Read &#8594;
                  </span>
                </div>
              </Link>
            </Inview>
          ))}
        </ul>
      </section>

      {/* ── Publications ── */}
      <section
        aria-labelledby="publications-heading"
        className="border-line border-t py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionHeading
            id="publications-heading"
            eyebrow="Research"
            heading="Published papers"
          />
          <ul className="mt-12 flex flex-col gap-6">
            {publications.map((pub, i) => (
              <Inview
                key={i}
                tag="li"
                mode="once"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                delayIn={i * 60}
                className="border-line flex flex-col gap-1 border-b pb-6 last:border-0 last:pb-0"
              >
                <p className="text-heading text-sm font-medium leading-snug">{pub.title}</p>
                <p className="text-foreground-muted text-xs">{pub.authors}</p>
                <p className="text-foreground-muted/70 text-xs">
                  {pub.venue}
                  {pub.year ? `, ${pub.year}` : ""}
                </p>
              </Inview>
            ))}
          </ul>
          <Inview
            tag="p"
            mode="once"
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
            className="text-foreground-muted mt-10 text-sm"
          >
            For copies of our papers, contact{" "}
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance underline underline-offset-2"
            >
              {contact.email}
            </a>
            .
          </Inview>
        </div>
      </section>
    </main>
  );
}
