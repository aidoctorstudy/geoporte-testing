import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TierInview as Inview } from "@/components/common/TierInview";
import { baseProjects } from "@/data/mocks/projects";

const FEATURED_REFS = ["C1", "C2", "C5", "C6"];

const featured = baseProjects.filter(
  (p) => p._ref && FEATURED_REFS.includes(p._ref)
);

export const RecentCommissionsSection = () => {
  return (
    <section
      id="recent-commissions"
      aria-labelledby="commissions-heading"
      className="bg-background relative z-10 mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="commissions-heading"
        eyebrow="Recent work"
        heading="Recent Geoporte commissions"
      />

      <p className="text-foreground-muted mt-6 max-w-2xl text-base leading-relaxed">
        Geoporte is engaged directly by lead consultants, contractors, developers
        and asset owners for specialist design, construction impact assessment and
        independent review.
      </p>

      <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((project, index) => (
          <Inview
            key={project._ref}
            tag="li"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={index * 80}
          >
            <div className="border-line bg-surface flex h-full flex-col rounded-2xl border overflow-hidden">
              <div className="relative h-40 w-full flex-shrink-0 overflow-hidden">
                <Image
                  src={project.image.src}
                  alt={project.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <span className="bg-accent mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white">
                    {project.label}
                  </span>
                  <h3 className="text-foreground mt-3 text-sm font-medium leading-snug">
                    {project.title}
                  </h3>
                </div>
                <p className="text-foreground-muted mt-4 text-xs">
                  {project.location}, {project.country}
                </p>
              </div>
            </div>
          </Inview>
        ))}
      </ul>

      <div className="mt-12">
        <Link
          href="/projects"
          className="bg-accent hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-colors"
        >
          View all projects
        </Link>
      </div>
    </section>
  );
};
