import type { Metadata } from "next";
import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "@/components/common/SectionHeading";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { sectors } from "@/data/mocks/sectors";

export function generateSectorsMetadata(): Metadata {
  return buildMetadata({
    title: "Sectors | Geoporte Middle East",
    description:
      "Geotechnical, structural and tunnelling engineering across rail and metro, water, ports, buildings, roads and bridges, energy and utilities in the Gulf.",
    url: "/sectors",
  });
}

export function SectorsIndexView() {
  return (
    <main>
      <section
        aria-labelledby="sectors-heading"
        className="border-line border-b py-24 md:py-36"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionHeading
            id="sectors-heading"
            tag="h1"
            eyebrow="Sectors"
            heading="Ground engineering by sector"
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
            Gulf infrastructure spans rail and metro, deep water and wastewater systems, ports and
            reclamation, buildings and high-rise developments, energy and roads. We work across all
            of them, with the same senior team leading every commission.
          </Inview>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector, i) => (
            <Inview
              key={sector.slug}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={i * 50}
            >
              <Link
                href={`/sectors/${sector.slug}`}
                className="border-line bg-surface hover:border-accent group flex h-full flex-col gap-4 rounded-2xl border p-6 transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                <h2 className="text-heading text-base font-semibold group-hover:text-accent transition-colors duration-[var(--duration-fast)] ease-entrance">
                  {sector.title}
                </h2>
                <p className="text-foreground-muted flex-1 text-sm leading-relaxed">
                  {sector.cardSummary}
                </p>
                <span className="text-label mt-auto inline-flex items-center gap-1 text-xs tracking-[0.1em] uppercase">
                  View sector
                  <span aria-hidden="true">&#8594;</span>
                </span>
              </Link>
            </Inview>
          ))}
        </ul>
      </section>
    </main>
  );
}
