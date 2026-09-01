import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { contact } from "@/lib/company";
import { services } from "@/data/mocks/services";
import { publications } from "@/data/mocks/publications";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Publications | Geoporte",
    description:
      "Technical papers, conference presentations and engineering insights from Geoporte's geotechnical, civil and structural specialists.",
    url: "/publications",
  });
}

// This page carries its own fixed Aurum Peak background (see
// `AurumPeakBackground.tsx`/`glass-background-routes.ts`), so every content
// section uses the `.glass-panel` treatment instead of an opaque one.
// `data-glass-readability` (globals.css) supplies the theme-aware
// --foreground/--foreground-muted override and text-shadow — see ADR-0064.
export function PublicationsView() {
  return (
    <div data-glass-readability>
      <section
        aria-labelledby="publications-heading"
        className="glass-panel relative z-10 mx-auto mt-24 max-w-6xl px-6 py-16 md:mt-32 md:px-8 md:py-24"
      >
        <SectionHeading
          id="publications-heading"
          tag="h1"
          eyebrow="Insights"
          heading="Technical publications & insights"
        />

        <Inview
          tag="p"
          mode="once"
          from={{ opacity: 0, y: 24 }}
          to={{ opacity: 1, y: 0 }}
          className="text-foreground-muted mt-8 max-w-2xl text-base leading-relaxed md:text-lg"
        >
          Our engineers regularly publish technical papers and present at industry conferences on ground behaviour, foundation design and risk-based engineering — drawn from decades of work on complex infrastructure projects across Australia, New Zealand and beyond.
        </Inview>
      </section>

      <section
        aria-labelledby="publications-list-heading"
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
      >
        <SectionHeading
          id="publications-list-heading"
          eyebrow="Recent work"
          heading="Selected publications"
        />

        <ul className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((publication, index) => (
            <Inview
              key={publication.title}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={index * 100}
            >
              <article className="border-line bg-surface flex h-full flex-col overflow-hidden rounded-2xl border">
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={publication.cover.src}
                    alt={publication.cover.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-5">
                  <h3 className="text-foreground text-sm font-medium leading-snug">
                    {publication.title}
                  </h3>
                  <p className="text-foreground-muted text-xs">
                    {publication.authors}
                  </p>
                  <p className="text-foreground-muted/70 mt-auto pt-2 text-xs">
                    {publication.venue}
                  </p>
                </div>
              </article>
            </Inview>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="publications-topics-heading"
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
      >
        <SectionHeading
          id="publications-topics-heading"
          eyebrow="Areas of research"
          heading="Where our engineers publish"
        />

        <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Inview
              key={service.slug}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={(index % 3) * 80}
            >
              <Link
                href={`/services/${service.slug}`}
                className="border-line bg-surface hover:border-accent/60 group block h-full rounded-2xl border p-6 transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                <h3 className="text-foreground group-hover:text-accent text-base font-medium transition-colors duration-[var(--duration-fast)] ease-entrance">
                  {service.title}
                </h3>
                <p className="text-foreground-muted mt-3 text-sm leading-relaxed">
                  {service.shortDescription}
                </p>
              </Link>
            </Inview>
          ))}
        </ul>
      </section>

      <Inview
        tag="section"
        aria-label="Request our publications"
        mode="once"
        from={{ opacity: 0, y: 24 }}
        to={{ opacity: 1, y: 0 }}
        delayIn={100}
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 text-center md:my-12 md:px-8 md:py-24"
      >
        <p className="text-foreground text-lg font-medium">
          More publications are added as they&apos;re presented.
        </p>
        <p className="text-foreground-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          For copies of our recent work, or papers not yet listed here, reach out to{" "}
          <a
            href={`mailto:${contact.email}`}
            className="text-accent hover:text-glow transition-colors duration-[var(--duration-fast)] ease-entrance"
          >
            {contact.email}
          </a>
          .
        </p>
      </Inview>
    </div>
  );
}
