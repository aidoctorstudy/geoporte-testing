import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { SectionHeading } from "@/components/common/SectionHeading";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { sectors, sectorSlugs } from "@/data/mocks/sectors";
import { baseProjects } from "@/data/mocks/projects";
import { TierInview } from "@/components/common/TierInview";

export function generateStaticParams() {
  return sectorSlugs.map((slug) => ({ slug }));
}

export function generateSectorMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const sector = sectors.find((s) => s.slug === params.slug);
  if (!sector) return {};
  return buildMetadata({
    title: sector.metaTitle,
    description: sector.metaDescription,
    url: `/sectors/${sector.slug}`,
  });
}

export function SectorDetailPage({ params }: { params: { slug: string } }) {
  const sector = sectors.find((s) => s.slug === params.slug);
  if (!sector) notFound();

  const relatedProjects = baseProjects.filter(
    (p) => p._ref && sector.relatedProjectRefs.includes(p._ref)
  );

  return (
    <main>
      <section
        aria-labelledby="sector-heading"
        className="border-line border-b py-24 md:py-36"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <Inview
            tag="p"
            mode="once"
            from={{ opacity: 0, y: 12 }}
            to={{ opacity: 1, y: 0 }}
            className="text-label mb-6 text-xs tracking-[0.3em] uppercase"
          >
            Sector
          </Inview>
          <SectionHeading
            id="sector-heading"
            tag="h1"
            eyebrow=""
            heading={sector.title}
            headingClassName="font-heading text-heading text-4xl font-medium leading-[1.1] md:text-6xl max-w-3xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr]">
          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-label text-xs tracking-[0.2em] uppercase">Overview</h2>
          </Inview>
          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={100}
            className="flex flex-col gap-5"
          >
            {sector.intro.map((para, i) => (
              <p key={i} className="text-foreground-muted text-base leading-relaxed md:text-lg">
                {para}
              </p>
            ))}
          </Inview>
        </div>
      </section>

      <section
        aria-labelledby="typical-work-heading"
        className="border-line border-y py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr]">
            <Inview
              tag="div"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
            >
              <h2
                id="typical-work-heading"
                className="text-label text-xs tracking-[0.2em] uppercase"
              >
                Typical work
              </h2>
            </Inview>
            <Inview
              tag="ul"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={100}
              className="flex flex-col gap-3"
            >
              {sector.typicalWork.map((item, i) => (
                <li
                  key={i}
                  className="text-foreground-muted border-line flex items-start gap-3 border-b pb-3 text-sm last:border-0 last:pb-0 leading-relaxed"
                >
                  <span
                    className="text-label mt-0.5 shrink-0 font-mono text-xs tracking-[0.1em]"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </Inview>
          </div>
        </div>
      </section>

      {relatedProjects.length > 0 && (
        <section
          aria-labelledby="related-projects-heading"
          className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
        >
          <SectionHeading
            id="related-projects-heading"
            eyebrow="Selected work"
            heading="Related projects"
          />
          <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProjects.map((project, i) => (
              <TierInview
                key={project.title}
                tag="li"
                mode="once"
                from={{ opacity: 0, y: 24 }}
                to={{ opacity: 1, y: 0 }}
                delayIn={i * 60}
                className="border-line bg-surface flex flex-col gap-3 rounded-2xl border p-6"
              >
                <span
                  className={`inline-flex self-start rounded-full px-3 py-0.5 text-xs font-medium ${
                    project.label === "Geoporte commission"
                      ? "bg-accent text-accent-foreground"
                      : "border-line border text-foreground-muted"
                  }`}
                >
                  {project.label}
                </span>
                <h3 className="text-heading text-sm font-semibold leading-snug">
                  {project.title}
                </h3>
                <p className="text-foreground-muted text-xs">{project.location}</p>
              </TierInview>
            ))}
          </ul>
          <p className="text-foreground-muted mt-8 text-xs leading-relaxed">
            Geoporte commission: delivered by Geoporte. Team experience: delivered by Geoporte&apos;s senior specialists in previous roles with international consultancies, shown to illustrate the depth of our people.
          </p>
        </section>
      )}

      <section className="border-line border-t py-20">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <Inview
            tag="h2"
            mode="once"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            className="font-heading text-heading text-2xl font-medium md:text-3xl"
          >
            Ready to engineer with confidence in complex ground?
          </Inview>
          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={100}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/contact"
              className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance"
            >
              Discuss your project
              <span aria-hidden="true">&#8594;</span>
            </Link>
            <Link
              href="/services"
              className="border-line text-foreground-muted hover:text-foreground inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance"
            >
              View all services
            </Link>
          </Inview>
        </div>
      </section>
    </main>
  );
}
